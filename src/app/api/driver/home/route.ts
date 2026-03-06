import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { trips, trucks, chemicalLoads, drivers } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { eq, and, inArray, desc } from "drizzle-orm"

export async function GET() {
  try {
    const { session } = await requireRole(["driver"])

    // Get the driver profile for this user
    const [driverProfile] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, session.user.id))

    if (!driverProfile) {
      return NextResponse.json({ driverProfile: null, activeTrip: null, upcomingTrips: [], stats: { completed: 0, total: 0 } })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // All trips for this driver
    const allTrips = await db
      .select({
        id: trips.id,
        status: trips.status,
        origin: trips.origin,
        destination: trips.destination,
        scheduledAt: trips.scheduledAt,
        startedAt: trips.startedAt,
        deliveredAt: trips.deliveredAt,
        notes: trips.notes,
        truckId: trips.truckId,
        truckName: trucks.name,
        truckPlate: trucks.plate,
        loadId: trips.loadId,
        loadName: chemicalLoads.name,
        loadHazardClass: chemicalLoads.hazardClass,
        loadUnNumber: chemicalLoads.unNumber,
        loadHandlingNotes: chemicalLoads.handlingNotes,
        loadRequiredCertifications: chemicalLoads.requiredCertifications,
      })
      .from(trips)
      .leftJoin(trucks, eq(trips.truckId, trucks.id))
      .leftJoin(chemicalLoads, eq(trips.loadId, chemicalLoads.id))
      .where(eq(trips.driverId, driverProfile.id))
      .orderBy(desc(trips.scheduledAt))

    const activeTrip = allTrips.find((t) =>
      t.status === "in_progress" || t.status === "assigned"
    ) ?? null

    const upcomingTrips = allTrips
      .filter((t) => t.status === "assigned" && t.id !== activeTrip?.id)
      .slice(0, 3)

    const completed = allTrips.filter((t) => t.status === "delivered").length

    return NextResponse.json({
      driverProfile,
      activeTrip,
      upcomingTrips,
      stats: { completed, total: allTrips.length },
    })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
