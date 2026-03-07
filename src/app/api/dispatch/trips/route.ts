import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { trips, trucks, drivers, chemicalLoads, notifications, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { desc, eq } from "drizzle-orm"

const tripSchema = z.object({
  loadId: z.string().min(1, "Chemical load is required"),
  truckId: z.string().min(1, "Truck is required"),
  driverId: z.string().min(1, "Driver is required"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  scheduledAt: z.string().min(1, "Scheduled date/time is required"),
  notes: z.string().optional().nullable(),
})

export async function GET() {
  try {
    await requireRole(["dispatcher", "admin"])

    const rows = await db
      .select({
        id: trips.id,
        status: trips.status,
        origin: trips.origin,
        destination: trips.destination,
        scheduledAt: trips.scheduledAt,
        startedAt: trips.startedAt,
        deliveredAt: trips.deliveredAt,
        notes: trips.notes,
        createdAt: trips.createdAt,
        truckId: trips.truckId,
        truckName: trucks.name,
        truckPlate: trucks.plate,
        driverId: trips.driverId,
        driverName: user.name,
        loadId: trips.loadId,
        loadName: chemicalLoads.name,
        loadHazardClass: chemicalLoads.hazardClass,
      })
      .from(trips)
      .leftJoin(trucks, eq(trips.truckId, trucks.id))
      .leftJoin(drivers, eq(trips.driverId, drivers.id))
      .leftJoin(user, eq(drivers.userId, user.id))
      .leftJoin(chemicalLoads, eq(trips.loadId, chemicalLoads.id))
      .orderBy(desc(trips.scheduledAt))

    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session } = await requireRole(["dispatcher", "admin"])
    const body = await req.json()
    const data = tripSchema.parse(body)

    const [trip] = await db.insert(trips).values({
      loadId: data.loadId,
      truckId: data.truckId,
      driverId: data.driverId,
      origin: data.origin,
      destination: data.destination,
      scheduledAt: new Date(data.scheduledAt),
      notes: data.notes ?? null,
      status: "assigned",
      createdBy: session.user.id,
    }).returning()

    // Notify the assigned driver
    const [driverRow] = await db
      .select({ userId: drivers.userId })
      .from(drivers)
      .where(eq(drivers.id, data.driverId))

    if (driverRow) {
      const [load] = await db
        .select({ name: chemicalLoads.name })
        .from(chemicalLoads)
        .where(eq(chemicalLoads.id, data.loadId))

      await db.insert(notifications).values({
        userId: driverRow.userId,
        type: "trip_assigned",
        message: `You have been assigned a new trip: ${load?.name ?? "chemical load"} from ${data.origin} to ${data.destination}.`,
        tripId: trip?.id,
      })
    }

    return NextResponse.json(trip, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
