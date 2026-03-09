import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { user } from "@/lib/schema"
import { requireRole } from "@/lib/session"

const patchSchema = z.object({
  role: z.enum(["admin", "dispatcher", "driver"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await requireRole(["admin"])
    const { id } = await params
    const body = await req.json()
    const { role } = patchSchema.parse(body)

    // Prevent admin from demoting themselves
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      )
    }

    const [updated] = await db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning({ id: user.id, name: user.name, role: user.role })

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
