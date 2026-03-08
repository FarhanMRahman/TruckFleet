import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { chemicalLoads, trips, drivers, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { upload } from "@/lib/storage"
import { createDedupedNotifications, getDispatcherUserIds } from "@/lib/notifications"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session } = await requireRole(["admin"])
    const uploaderId = session.user.id
    const { id } = await params

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeName = `sds-${id}-${Date.now()}.pdf`
    const result = await upload(buffer, safeName, "sds")

    const [load] = await db
      .update(chemicalLoads)
      .set({ sdsDocumentUrl: result.url })
      .where(eq(chemicalLoads.id, id))
      .returning({ name: chemicalLoads.name })

    // Fire-and-forget notifications to dispatchers + assigned drivers
    if (load) {
      const message = `SDS document uploaded for ${load.name}`
      const actionUrl = result.url

      getDispatcherUserIds().then(async (dispatcherIds) => {
        // Get user IDs of drivers assigned to trips using this load
        const assignedTrips = await db
          .select({ userId: user.id })
          .from(trips)
          .innerJoin(drivers, eq(trips.driverId, drivers.id))
          .innerJoin(user, eq(drivers.userId, user.id))
          .where(eq(trips.loadId, id))

        const driverUserIds = assignedTrips.map((r) => r.userId)
        const allUserIds = [...new Set([...dispatcherIds, ...driverUserIds])].filter((uid) => uid !== uploaderId)

        return createDedupedNotifications({
          userIds: allUserIds,
          type: "sds_uploaded",
          message,
          actionUrl,
          dedupWindowHours: 24,
        })
      }).catch(() => {})
    }

    return NextResponse.json({ url: result.url })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id } = await params

    await db
      .update(chemicalLoads)
      .set({ sdsDocumentUrl: null })
      .where(eq(chemicalLoads.id, id))

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
