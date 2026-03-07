import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { truckLocations, trucks, drivers, trips, chemicalLoads, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { eq, and, inArray, sql, desc } from "drizzle-orm"

const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes
const DELAY_THRESHOLD_MS = 2 * 60 * 60 * 1000 // 2 hours past scheduled

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

    const now = new Date()
    const alerts: Alert[] = []

    // ── Offline alerts ────────────────────────────────────────────────────────
    // Get latest location per truck for active trips
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
      .where(inArray(trips.status, ["assigned", "in_progress"]))

    for (const loc of activeLocations) {
      const msSinceLastPing = now.getTime() - new Date(loc.lastPing).getTime()
      if (msSinceLastPing > OFFLINE_THRESHOLD_MS) {
        alerts.push({
          type: "offline",
          truckId: loc.truckId,
          truckName: loc.truckName,
          truckPlate: loc.truckPlate,
          driverName: loc.driverName,
          lastPing: loc.lastPing,
          minutesSinceLastPing: Math.floor(msSinceLastPing / 60_000),
        })
      }
    }

    // ── Delay alerts ──────────────────────────────────────────────────────────
    const activeTrips = await db
      .select({
        tripId: trips.id,
        origin: trips.origin,
        destination: trips.destination,
        scheduledAt: trips.scheduledAt,
        truckName: trucks.name,
        driverName: user.name,
        loadName: chemicalLoads.name,
      })
      .from(trips)
      .leftJoin(trucks, eq(trips.truckId, trucks.id))
      .leftJoin(drivers, eq(trips.driverId, drivers.id))
      .leftJoin(user, eq(drivers.userId, user.id))
      .leftJoin(chemicalLoads, eq(trips.loadId, chemicalLoads.id))
      .where(eq(trips.status, "in_progress"))
      .orderBy(desc(trips.scheduledAt))

    for (const trip of activeTrips) {
      if (!trip.scheduledAt) continue
      const msOverdue = now.getTime() - new Date(trip.scheduledAt).getTime()
      if (msOverdue > DELAY_THRESHOLD_MS) {
        alerts.push({
          type: "delay",
          tripId: trip.tripId,
          truckName: trip.truckName,
          driverName: trip.driverName,
          loadName: trip.loadName,
          origin: trip.origin,
          destination: trip.destination,
          scheduledAt: trip.scheduledAt,
          hoursOverdue: Math.floor(msOverdue / 3_600_000),
        })
      }
    }

    return NextResponse.json(alerts)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
