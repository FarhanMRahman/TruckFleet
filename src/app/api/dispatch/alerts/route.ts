import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { truckLocations, trucks, drivers, trips, chemicalLoads, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { eq, and, inArray, sql, desc } from "drizzle-orm"
import { createDedupedNotifications, getDispatcherUserIds } from "@/lib/notifications"

export type OfflineAlert = {
  type: "offline"
  truckId: string
  truckName: string
  truckPlate: string
  driverName: string | null
  lastPing: Date
  minutesSinceLastPing: number
}

export type DelayAlert = {
  type: "delay"
  tripId: string
  truckName: string | null
  driverName: string | null
  loadName: string | null
  origin: string
  destination: string
  scheduledAt: Date
  hoursOverdue: number
}

export type Alert = OfflineAlert | DelayAlert

export async function GET() {
  try {
    await requireRole(["admin", "dispatcher"])

    const alerts: Alert[] = []

    // ── Offline alerts ────────────────────────────────────────────────────────
    // Trucks on active trips whose last ping was > 10 minutes ago (compared in DB)
    const latestPerTruck = db
      .select({
        truckId: truckLocations.truckId,
        maxRecordedAt: sql<Date>`MAX(${truckLocations.recordedAt})`.as("max_recorded_at"),
      })
      .from(truckLocations)
      .groupBy(truckLocations.truckId)
      .as("latest_per_truck")

    const activeLocations = await db
      .select({
        truckId: trucks.id,
        truckName: trucks.name,
        truckPlate: trucks.plate,
        driverName: user.name,
        lastPing: latestPerTruck.maxRecordedAt,
        minutesOffline: sql<number>`EXTRACT(EPOCH FROM (NOW() - ${latestPerTruck.maxRecordedAt})) / 60`.as("minutes_offline"),
      })
      .from(trucks)
      .innerJoin(latestPerTruck, eq(trucks.id, latestPerTruck.truckId))
      .leftJoin(
        trips,
        and(
          eq(trips.truckId, trucks.id),
          inArray(trips.status, ["assigned", "in_progress"])
        )
      )
      .leftJoin(drivers, eq(trips.driverId, drivers.id))
      .leftJoin(user, eq(drivers.userId, user.id))
      .where(
        and(
          inArray(trips.status, ["assigned", "in_progress"]),
          sql`${latestPerTruck.maxRecordedAt} < NOW() - INTERVAL '10 minutes'`
        )
      )

    for (const loc of activeLocations) {
      alerts.push({
        type: "offline",
        truckId: loc.truckId,
        truckName: loc.truckName,
        truckPlate: loc.truckPlate,
        driverName: loc.driverName,
        lastPing: loc.lastPing,
        minutesSinceLastPing: Math.floor(Number(loc.minutesOffline)),
      })
    }

    // ── Delay alerts ──────────────────────────────────────────────────────────
    // In-progress trips whose scheduledAt was > 2 hours ago (compared in DB)
    const activeTrips = await db
      .select({
        tripId: trips.id,
        origin: trips.origin,
        destination: trips.destination,
        scheduledAt: trips.scheduledAt,
        truckName: trucks.name,
        driverName: user.name,
        loadName: chemicalLoads.name,
        hoursOverdue: sql<number>`EXTRACT(EPOCH FROM (NOW() - ${trips.scheduledAt})) / 3600`.as("hours_overdue"),
      })
      .from(trips)
      .leftJoin(trucks, eq(trips.truckId, trucks.id))
      .leftJoin(drivers, eq(trips.driverId, drivers.id))
      .leftJoin(user, eq(drivers.userId, user.id))
      .leftJoin(chemicalLoads, eq(trips.loadId, chemicalLoads.id))
      .where(
        and(
          eq(trips.status, "in_progress"),
          sql`${trips.scheduledAt} < NOW() - INTERVAL '2 hours'`
        )
      )
      .orderBy(desc(trips.scheduledAt))

    for (const trip of activeTrips) {
      if (!trip.scheduledAt) continue
      alerts.push({
        type: "delay",
        tripId: trip.tripId,
        truckName: trip.truckName,
        driverName: trip.driverName,
        loadName: trip.loadName,
        origin: trip.origin,
        destination: trip.destination,
        scheduledAt: trip.scheduledAt,
        hoursOverdue: Math.floor(Number(trip.hoursOverdue)),
      })
    }

    // Create deduped notifications for dispatchers/admins
    if (alerts.length > 0) {
      const dispatcherIds = await getDispatcherUserIds()
      await Promise.all(
        alerts.map((alert) => {
          if (alert.type === "offline") {
            return createDedupedNotifications({
              userIds: dispatcherIds,
              type: "offline_alert",
              message: `Truck ${alert.truckName} (${alert.truckPlate}) has been offline for ${alert.minutesSinceLastPing} min`,
              tripId: alert.truckId,
            })
          } else {
            return createDedupedNotifications({
              userIds: dispatcherIds,
              type: "delay_alert",
              message: `Trip delayed: ${alert.loadName ?? "Unknown load"} — ${alert.origin} → ${alert.destination} (${alert.hoursOverdue}h overdue)`,
              tripId: alert.tripId,
            })
          }
        })
      )
    }

    return NextResponse.json(alerts)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
