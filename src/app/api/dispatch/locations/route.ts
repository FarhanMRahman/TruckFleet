import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { truckLocations, trucks, drivers, trips, chemicalLoads, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { eq, desc, and, inArray, sql } from "drizzle-orm"

export async function GET() {
  try {
    await requireRole(["admin", "dispatcher"])

    // Latest location per truck using a subquery
    const latestIds = db
      .select({
        id: sql<string>`DISTINCT ON (${truckLocations.truckId}) ${truckLocations.id}`,
      })
      .from(truckLocations)
      .orderBy(truckLocations.truckId, desc(truckLocations.recordedAt))
      .as("latest_ids")

    const rows = await db
      .select({
        locationId: truckLocations.id,
        lat: truckLocations.lat,
        lng: truckLocations.lng,
        heading: truckLocations.heading,
        speed: truckLocations.speed,
        recordedAt: truckLocations.recordedAt,
        truckId: trucks.id,
        truckName: trucks.name,
        truckPlate: trucks.plate,
        truckType: trucks.type,
        truckStatus: trucks.status,
        driverName: user.name,
        tripStatus: trips.status,
        loadName: chemicalLoads.name,
        loadHazardClass: chemicalLoads.hazardClass,
      })
      .from(truckLocations)
      .innerJoin(latestIds, eq(truckLocations.id, latestIds.id))
      .innerJoin(trucks, eq(truckLocations.truckId, trucks.id))
      .leftJoin(drivers, eq(truckLocations.driverId, drivers.id))
      .leftJoin(user, eq(drivers.userId, user.id))
      .leftJoin(
        trips,
        and(
          eq(trips.truckId, trucks.id),
          inArray(trips.status, ["assigned", "in_progress"])
        )
      )
      .leftJoin(chemicalLoads, eq(trips.loadId, chemicalLoads.id))

    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
