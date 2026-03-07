import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { chemicalLoads } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"

const loadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  hazardClass: z.string().min(1, "Hazard class is required"),
  unNumber: z.string().optional().nullable(),
  requiredVehicleType: z.string().min(1, "Required vehicle type is required"),
  requiredCertifications: z.array(z.string()).default([]),
  handlingNotes: z.string().optional().nullable(),
})

export async function GET() {
  try {
    await requireRole(["admin", "dispatcher"])
    const loads = await db.select().from(chemicalLoads).orderBy(chemicalLoads.name)
    return NextResponse.json(loads)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"])
    const body = await req.json()
    const data = loadSchema.parse(body)

    const [load] = await db.insert(chemicalLoads).values({
      name: data.name,
      hazardClass: data.hazardClass,
      unNumber: data.unNumber ?? null,
      requiredVehicleType: data.requiredVehicleType,
      requiredCertifications: data.requiredCertifications,
      handlingNotes: data.handlingNotes ?? null,
    }).returning()

    return NextResponse.json(load, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
