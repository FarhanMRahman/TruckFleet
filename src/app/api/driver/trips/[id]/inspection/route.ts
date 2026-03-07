import { NextResponse } from "next/server"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { tripInspections, trips, drivers, hosLogs } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const SubmitSchema = z.object({
  type: z.enum(["pre", "post"]),
  items: z.array(z.object({ item: z.string(), checked: z.boolean() })).min(1),
})

async function getDriverId(userId: string) {
  const [driver] = await db
    .select({ id: drivers.id })
    .from(drivers)
    .where(eq(drivers.userId, userId))
    .limit(1)
  return driver?.id ?? null
}

// GET ?type=pre|post — check if inspection exists
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["driver"])
    const { id: tripId } = await params
    const url = new URL(_req.url)
    const type = url.searchParams.get("type") as "pre" | "post" | null
    if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 })

    const [inspection] = await db
      .select()
      .from(tripInspections)
      .where(and(eq(tripInspections.tripId, tripId), eq(tripInspections.type, type)))
      .limit(1)

    return NextResponse.json({ exists: !!inspection, inspection: inspection ?? null })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// POST — submit inspection and advance trip status
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["driver"])
    const { id: tripId } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const driverId = await getDriverId(session.user.id)
    if (!driverId) return NextResponse.json({ error: "Driver profile not found" }, { status: 403 })

    const body = await req.json()
    const parsed = SubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }

    const { type, items } = parsed.data

    // Verify the trip belongs to this driver
    const [trip] = await db
      .select({ id: trips.id, status: trips.status, startedAt: trips.startedAt })
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.driverId, driverId)))
      .limit(1)

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 })

    // Upsert: delete existing then insert (idempotent re-submission)
    await db
      .delete(tripInspections)
      .where(and(eq(tripInspections.tripId, tripId), eq(tripInspections.type, type)))

    const [inspection] = await db
      .insert(tripInspections)
      .values({ tripId, driverId, type, items })
      .returning()

    // Advance trip status after inspection
    if (type === "pre" && trip.status === "assigned") {
      await db
        .update(trips)
        .set({ status: "in_progress", startedAt: new Date() })
        .where(eq(trips.id, tripId))
    } else if (type === "post" && trip.status === "in_progress") {
      const deliveredAt = new Date()
      await db
        .update(trips)
        .set({ status: "delivered", deliveredAt })
        .where(eq(trips.id, tripId))

      // Record driving time in HOS log
      const drivingMinutes = trip.startedAt
        ? Math.round((deliveredAt.getTime() - trip.startedAt.getTime()) / 60000)
        : 0
      await db.insert(hosLogs).values({
        driverId,
        tripId,
        type: "driving",
        shiftStart: trip.startedAt ?? deliveredAt,
        shiftEnd: deliveredAt,
        drivingMinutes,
      })
    }

    return NextResponse.json({ inspection })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
