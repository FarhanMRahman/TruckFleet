import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { trips } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { eq } from "drizzle-orm"

const statusSchema = z.object({
  status: z.enum(["draft", "assigned", "in_progress", "delivered", "cancelled"]),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["dispatcher", "admin"])
    const { id } = await params
    const body = await req.json()
    const { status } = statusSchema.parse(body)

    const now = new Date()
    const [updated] = await db
      .update(trips)
      .set({
        status,
        ...(status === "in_progress" ? { startedAt: now } : {}),
        ...(status === "delivered" ? { deliveredAt: now } : {}),
      })
      .where(eq(trips.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["dispatcher", "admin"])
    const { id } = await params
    await db.delete(trips).where(eq(trips.id, id))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
