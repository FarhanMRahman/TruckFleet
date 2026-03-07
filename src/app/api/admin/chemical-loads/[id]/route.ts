import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { chemicalLoads } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { eq } from "drizzle-orm"

const loadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  hazardClass: z.string().min(1, "Hazard class is required"),
  unNumber: z.string().optional().nullable(),
  requiredVehicleType: z.string().min(1, "Required vehicle type is required"),
  requiredCertifications: z.array(z.string()).default([]),
  handlingNotes: z.string().optional().nullable(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"])
    const { id } = await params
    const body = await req.json()
    const data = loadSchema.parse(body)

    const [updated] = await db
      .update(chemicalLoads)
      .set({
        name: data.name,
        hazardClass: data.hazardClass,
        unNumber: data.unNumber ?? null,
        requiredVehicleType: data.requiredVehicleType,
        requiredCertifications: data.requiredCertifications,
        handlingNotes: data.handlingNotes ?? null,
      })
      .where(eq(chemicalLoads.id, id))
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

    await db.delete(chemicalLoads).where(eq(chemicalLoads.id, id))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
