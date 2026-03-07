import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { drivers, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { eq } from "drizzle-orm"

const driverSchema = z.object({
  userId: z.string().min(1, "User is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  certifications: z.array(z.string()).default([]),
  status: z.enum(["available", "on_shift", "driving", "delivering", "off_duty"]).default("available"),
})

export async function GET() {
  try {
    await requireRole(["admin"])
    const rows = await db
      .select({
        id: drivers.id,
        userId: drivers.userId,
        licenseNumber: drivers.licenseNumber,
        certifications: drivers.certifications,
        status: drivers.status,
        createdAt: drivers.createdAt,
        updatedAt: drivers.updatedAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(drivers)
      .leftJoin(user, eq(drivers.userId, user.id))
      .orderBy(user.name)
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"])
    const body = await req.json()
    const data = driverSchema.parse(body)

    const [driver] = await db.insert(drivers).values({
      userId: data.userId,
      licenseNumber: data.licenseNumber,
      certifications: data.certifications,
      status: data.status,
    }).returning()

    return NextResponse.json(driver, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    // Unique constraint on userId
    if (err instanceof Error && err.message.includes("unique")) {
      return NextResponse.json({ error: "This user already has a driver profile" }, { status: 409 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
