import { NextResponse } from "next/server"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { proofOfDeliveries, trips, drivers } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const PodSchema = z.object({
  signatureDataUrl: z.string().min(1),
  notes: z.string().optional(),
})

async function getDriverId(userId: string) {
  const [driver] = await db
    .select({ id: drivers.id })
    .from(drivers)
    .where(eq(drivers.userId, userId))
    .limit(1)
  return driver?.id ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["driver"])
    const { id: tripId } = await params
    const [pod] = await db
      .select()
      .from(proofOfDeliveries)
      .where(eq(proofOfDeliveries.tripId, tripId))
      .limit(1)
    return NextResponse.json({ pod: pod ?? null })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

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
    const parsed = PodSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }

    // Verify the trip belongs to this driver and is delivered
    const [trip] = await db
      .select({ id: trips.id, status: trips.status })
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.driverId, driverId)))
      .limit(1)

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 })

    // Upsert POD
    await db
      .delete(proofOfDeliveries)
      .where(eq(proofOfDeliveries.tripId, tripId))

    const [pod] = await db
      .insert(proofOfDeliveries)
      .values({ tripId, driverId, signatureDataUrl: parsed.data.signatureDataUrl, notes: parsed.data.notes ?? null })
      .returning()

    return NextResponse.json({ pod })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
