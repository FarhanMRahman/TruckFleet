import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { truckLocations, trucks, drivers, trips, chemicalLoads, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { eq, and, inArray, sql } from "drizzle-orm"

export async function GET() {
  try {
    await requireRole(["admin", "dispatcher"])
    return NextResponse.json(await fetchLatestLocations())
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function fetchLatestLocations() {
  // Subquery: max recordedAt per truck
  const latest = db
    .select({
      truckId: truckLocations.truckId,
      maxRecordedAt: sql<Date>`MAX(${truckLocations.recordedAt})`.as("max_recorded_at"),
    })
    .from(truckLocations)
    .groupBy(truckLocations.truckId)
    .as("latest")

  return db
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
    .innerJoin(
      latest,
      and(
        eq(truckLocations.truckId, latest.truckId),
        eq(truckLocations.recordedAt, latest.maxRecordedAt)
      )
    )
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
}
