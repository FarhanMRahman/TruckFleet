import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { drivers, hosLogs } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { eq, isNull, and } from "drizzle-orm"

const statusSchema = z.object({
  status: z.enum(["available", "on_shift", "driving", "delivering", "off_duty"]),
})

export async function PATCH(req: NextRequest) {
  try {
    const { session } = await requireRole(["driver"])
    const body = await req.json()
    const { status } = statusSchema.parse(body)

    const [driver] = await db
      .select({ id: drivers.id, status: drivers.status })
      .from(drivers)
      .where(eq(drivers.userId, session.user.id))
      .limit(1)

    if (!driver) {
      return NextResponse.json({ error: "No driver profile found" }, { status: 404 })
    }

    const now = new Date()

    // Open a shift log when going on_shift
    if (status === "on_shift" && driver.status !== "on_shift") {
      await db.insert(hosLogs).values({ driverId: driver.id, type: "shift", shiftStart: now })
    }

    // Close any open shift log when leaving on_shift
    if (driver.status === "on_shift" && status !== "on_shift") {
      await db
        .update(hosLogs)
        .set({ shiftEnd: now })
        .where(and(eq(hosLogs.driverId, driver.id), eq(hosLogs.type, "shift"), isNull(hosLogs.shiftEnd)))
    }

    const [updated] = await db
      .update(drivers)
      .set({ status })
      .where(eq(drivers.id, driver.id))
      .returning()

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
