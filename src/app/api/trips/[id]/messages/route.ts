import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { messages, trips, drivers } from "@/lib/schema"
import { requireAuth } from "@/lib/session"
import { z } from "zod"
import { and, asc, eq } from "drizzle-orm"

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(1000),
})

async function canAccessTrip(tripId: string, userId: string, role: string) {
  if (role === "admin" || role === "dispatcher") return true
  if (role === "driver") {
    const [driverProfile] = await db.select().from(drivers).where(eq(drivers.userId, userId))
    if (!driverProfile) return false
    const [trip] = await db.select({ id: trips.id }).from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.driverId, driverProfile.id)))
    return !!trip
  }
  return false
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const role = (session.user as { role?: string }).role ?? ""

    if (!await canAccessTrip(id, session.user.id, role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.tripId, id))
      .orderBy(asc(messages.createdAt))

    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const role = (session.user as { role?: string }).role ?? ""

    if (!await canAccessTrip(id, session.user.id, role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { content } = messageSchema.parse(body)

    const [message] = await db.insert(messages).values({
      tripId: id,
      senderId: session.user.id,
      senderName: session.user.name,
      content,
    }).returning()

    return NextResponse.json(message, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
