import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { trips, drivers } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { and, eq } from "drizzle-orm"

const statusSchema = z.object({
  status: z.enum(["in_progress", "delivered"]),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await requireRole(["driver"])
    const { id } = await params
    const body = await req.json()
    const { status } = statusSchema.parse(body)

    const [driverProfile] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, session.user.id))

    if (!driverProfile) {
      return NextResponse.json({ error: "No driver profile" }, { status: 403 })
    }

    const now = new Date()
    const [updated] = await db
      .update(trips)
      .set({
        status,
        ...(status === "in_progress" ? { startedAt: now } : {}),
        ...(status === "delivered" ? { deliveredAt: now } : {}),
      })
      .where(and(eq(trips.id, id), eq(trips.driverId, driverProfile.id)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
