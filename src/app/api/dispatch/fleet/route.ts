import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { trucks, drivers, trips, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { eq, inArray } from "drizzle-orm"

export async function GET() {
  try {
    await requireRole(["dispatcher", "admin"])

    // Active trip truck/driver IDs
    const activeTrips = await db
      .select({
        truckId: trips.truckId,
        driverId: trips.driverId,
        status: trips.status,
        origin: trips.origin,
        destination: trips.destination,
        scheduledAt: trips.scheduledAt,
      })
      .from(trips)
      .where(inArray(trips.status, ["assigned", "in_progress"]))

    const busyTruckIds = new Set(activeTrips.map((t) => t.truckId).filter(Boolean))
    const busyDriverIds = new Set(activeTrips.map((t) => t.driverId).filter(Boolean))

    const tripByTruck = Object.fromEntries(
      activeTrips.filter((t) => t.truckId).map((t) => [t.truckId!, t])
    )
    const tripByDriver = Object.fromEntries(
      activeTrips.filter((t) => t.driverId).map((t) => [t.driverId!, t])
    )

    const allTrucks = await db.select().from(trucks).orderBy(trucks.name)
    const allDrivers = await db
      .select({
        id: drivers.id,
        userId: drivers.userId,
        licenseNumber: drivers.licenseNumber,
        certifications: drivers.certifications,
        status: drivers.status,
        userName: user.name,
        userEmail: user.email,
      })
      .from(drivers)
      .leftJoin(user, eq(drivers.userId, user.id))
      .orderBy(user.name)

    const truckRows = allTrucks.map((t) => ({
      ...t,
      activeTrip: tripByTruck[t.id] ?? null,
    }))

    const driverRows = allDrivers.map((d) => ({
      ...d,
      activeTrip: tripByDriver[d.id] ?? null,
    }))

    return NextResponse.json({ trucks: truckRows, drivers: driverRows })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
