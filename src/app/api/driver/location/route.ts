import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { truckLocations, drivers, trips } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { and, eq, inArray } from "drizzle-orm"

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional().nullable(),
  speed: z.number().min(0).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const { session } = await requireRole(["driver"])
    const body = await req.json()
    const data = locationSchema.parse(body)

    // Get the driver's profile
    const [driverProfile] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, session.user.id))

    if (!driverProfile) {
      return NextResponse.json({ error: "No driver profile" }, { status: 403 })
    }

    // Find active trip to get truck
    const [activeTrip] = await db
      .select({ truckId: trips.truckId })
      .from(trips)
      .where(
        and(
          eq(trips.driverId, driverProfile.id),
          inArray(trips.status, ["assigned", "in_progress"])
        )
      )

    if (!activeTrip?.truckId) {
      return NextResponse.json({ error: "No active trip with a truck" }, { status: 400 })
    }

    const [location] = await db.insert(truckLocations).values({
      truckId: activeTrip.truckId,
      driverId: driverProfile.id,
      lat: data.lat,
      lng: data.lng,
      heading: data.heading ?? null,
      speed: data.speed ?? null,
    }).returning()

    return NextResponse.json(location, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
