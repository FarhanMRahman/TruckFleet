import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { drivers } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { z } from "zod"
import { eq } from "drizzle-orm"

const statusSchema = z.object({
  status: z.enum(["available", "on_shift", "driving", "delivering", "off_duty"]),
})

export async function PATCH(req: NextRequest) {
  try {
    const { session } = await requireRole(["driver"])
    const body = await req.json()
    const { status } = statusSchema.parse(body)

    const [updated] = await db
      .update(drivers)
      .set({ status })
      .where(eq(drivers.userId, session.user.id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "No driver profile found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
