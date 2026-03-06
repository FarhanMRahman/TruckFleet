import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { drivers } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { eq } from "drizzle-orm"

const driverSchema = z.object({
  licenseNumber: z.string().min(1, "License number is required"),
  certifications: z.array(z.string()).default([]),
  status: z.enum(["available", "on_shift", "driving", "delivering", "off_duty"]),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"])
    const { id } = await params
    const body = await req.json()
    const data = driverSchema.parse(body)

    const [updated] = await db
      .update(drivers)
      .set({
        licenseNumber: data.licenseNumber,
        certifications: data.certifications,
        status: data.status,
      })
      .where(eq(drivers.id, id))
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
    await requireRole(["admin"])
    const { id } = await params
    await db.delete(drivers).where(eq(drivers.id, id))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
