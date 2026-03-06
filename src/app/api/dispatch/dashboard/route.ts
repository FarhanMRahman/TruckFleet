import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { trips, trucks, drivers, chemicalLoads, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { eq, inArray, and, gte, lt, desc } from "drizzle-orm"

export async function GET() {
  try {
    await requireRole(["dispatcher", "admin"])

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const [
      activeTrips,
      scheduledToday,
      availableTrucksCount,
      availableDriversCount,
      recentTrips,
    ] = await Promise.all([
      db.select({ id: trips.id }).from(trips)
        .where(inArray(trips.status, ["assigned", "in_progress"])),

      db.select({ id: trips.id }).from(trips)
        .where(and(
          gte(trips.scheduledAt, todayStart),
          lt(trips.scheduledAt, todayEnd),
        )),

      db.select({ id: trucks.id }).from(trucks)
        .where(eq(trucks.status, "available")),

      db.select({ id: drivers.id }).from(drivers)
        .where(eq(drivers.status, "available")),

      db.select({
        id: trips.id,
        status: trips.status,
        origin: trips.origin,
        destination: trips.destination,
        scheduledAt: trips.scheduledAt,
        truckName: trucks.name,
        driverName: user.name,
        loadName: chemicalLoads.name,
        loadHazardClass: chemicalLoads.hazardClass,
      })
        .from(trips)
        .leftJoin(trucks, eq(trips.truckId, trucks.id))
        .leftJoin(drivers, eq(trips.driverId, drivers.id))
        .leftJoin(user, eq(drivers.userId, user.id))
        .leftJoin(chemicalLoads, eq(trips.loadId, chemicalLoads.id))
        .orderBy(desc(trips.scheduledAt))
        .limit(5),
    ])

    return NextResponse.json({
      stats: {
        activeTrips: activeTrips.length,
        scheduledToday: scheduledToday.length,
        availableTrucks: availableTrucksCount.length,
        availableDrivers: availableDriversCount.length,
      },
      recentTrips,
    })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
