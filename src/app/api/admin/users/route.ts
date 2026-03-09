import { NextResponse } from "next/server"
import { asc } from "drizzle-orm"
import { db } from "@/lib/db"
import { user } from "@/lib/schema"
import { requireRole } from "@/lib/session"

export async function GET() {
  try {
    await requireRole(["admin"])

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(asc(user.name))

    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
