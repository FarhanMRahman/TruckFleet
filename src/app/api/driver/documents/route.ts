import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { drivers, trips, chemicalLoads } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET() {
  try {
    await requireRole(["driver"])

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [driver] = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(eq(drivers.userId, session.user.id))
      .limit(1)

    if (!driver) return NextResponse.json([])

    // Get all trips for this driver that have a load with an SDS document
    const rows = await db
      .select({
        tripId: trips.id,
        origin: trips.origin,
        destination: trips.destination,
        status: trips.status,
        scheduledAt: trips.scheduledAt,
        loadId: chemicalLoads.id,
        loadName: chemicalLoads.name,
        hazardClass: chemicalLoads.hazardClass,
        unNumber: chemicalLoads.unNumber,
        sdsDocumentUrl: chemicalLoads.sdsDocumentUrl,
      })
      .from(trips)
      .innerJoin(chemicalLoads, eq(trips.loadId, chemicalLoads.id))
      .where(eq(trips.driverId, driver.id))
      .orderBy(trips.createdAt)

    // Only return rows where a SDS doc exists OR load info is useful
    // Return all trips with load info (driver may need load info even without SDS)
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
