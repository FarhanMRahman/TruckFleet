import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { trucks } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { eq } from "drizzle-orm"

const truckSchema = z.object({
  name: z.string().min(1, "Name is required"),
  plate: z.string().min(1, "Plate number is required"),
  type: z.string().min(1, "Vehicle type is required"),
  status: z.enum(["available", "on_trip", "maintenance", "inactive"]),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"])
    const { id } = await params
    const body = await req.json()
    const data = truckSchema.parse(body)

    const [updated] = await db
      .update(trucks)
      .set({
        name: data.name,
        plate: data.plate,
        type: data.type,
        status: data.status,
      })
      .where(eq(trucks.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"])
    const { id } = await params
    await db.delete(trucks).where(eq(trucks.id, id))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
