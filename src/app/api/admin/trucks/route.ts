import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { trucks } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { asc } from "drizzle-orm"

const truckSchema = z.object({
  name: z.string().min(1, "Name is required"),
  plate: z.string().min(1, "Plate number is required"),
  type: z.string().min(1, "Vehicle type is required"),
  status: z.enum(["available", "on_trip", "maintenance", "inactive"]).default("available"),
})

export async function GET() {
  try {
    await requireRole(["admin"])
    const rows = await db.select().from(trucks).orderBy(asc(trucks.name))
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"])
    const body = await req.json()
    const data = truckSchema.parse(body)

    const [truck] = await db.insert(trucks).values({
      name: data.name,
      plate: data.plate,
      type: data.type,
      status: data.status,
    }).returning()

    return NextResponse.json(truck, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
