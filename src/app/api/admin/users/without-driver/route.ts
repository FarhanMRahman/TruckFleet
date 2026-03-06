import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user, drivers } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { notInArray } from "drizzle-orm"
import { asc } from "drizzle-orm"

export async function GET() {
  try {
    await requireRole(["admin"])

    // Get all user IDs that already have a driver profile
    const existing = await db.select({ userId: drivers.userId }).from(drivers)
    const existingUserIds = existing.map((r) => r.userId)

    const users =
      existingUserIds.length > 0
        ? await db
            .select({ id: user.id, name: user.name, email: user.email })
            .from(user)
            .where(notInArray(user.id, existingUserIds))
            .orderBy(asc(user.name))
        : await db
            .select({ id: user.id, name: user.name, email: user.email })
            .from(user)
            .orderBy(asc(user.name))

    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
