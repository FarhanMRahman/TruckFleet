import { NextResponse } from "next/server"
import { eq, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { trips, trucks, chemicalLoads, drivers } from "@/lib/schema"
import { requireRole } from "@/lib/session"

export async function GET() {
  try {
    const { session } = await requireRole(["driver"])

    const [driverProfile] = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(eq(drivers.userId, session.user.id))
      .limit(1)

    if (!driverProfile) return NextResponse.json([])

    const allTrips = await db
      .select({
        id: trips.id,
        status: trips.status,
        origin: trips.origin,
        destination: trips.destination,
        scheduledAt: trips.scheduledAt,
        loadName: chemicalLoads.name,
        loadHazardClass: chemicalLoads.hazardClass,
      })
      .from(trips)
      .leftJoin(trucks, eq(trips.truckId, trucks.id))
      .leftJoin(chemicalLoads, eq(trips.loadId, chemicalLoads.id))
      .where(eq(trips.driverId, driverProfile.id))
      .orderBy(desc(trips.scheduledAt))

    return NextResponse.json(allTrips)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
