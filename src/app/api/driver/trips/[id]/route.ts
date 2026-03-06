import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { trips, trucks, chemicalLoads, drivers } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { and, eq } from "drizzle-orm"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await requireRole(["driver"])
    const { id } = await params

    // Verify this trip belongs to the current driver
    const [driverProfile] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, session.user.id))

    if (!driverProfile) {
      return NextResponse.json({ error: "No driver profile" }, { status: 403 })
    }

    const [trip] = await db
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
        truckType: trucks.type,
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
      .where(and(eq(trips.id, id), eq(trips.driverId, driverProfile.id)))

    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(trip)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
