import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notifications } from "@/lib/schema"
import { requireAuth } from "@/lib/session"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  try {
    const session = await requireAuth()
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20)
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
