import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { tripInspections } from "@/lib/schema"
import { requireRole } from "@/lib/session"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin", "dispatcher"])
    const { id: tripId } = await params

    const inspections = await db
      .select()
      .from(tripInspections)
      .where(eq(tripInspections.tripId, tripId))

    const pre = inspections.find((i) => i.type === "pre") ?? null
    const post = inspections.find((i) => i.type === "post") ?? null

    return NextResponse.json({ pre, post })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
