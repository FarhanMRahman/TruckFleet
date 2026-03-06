import type { TruckLocation } from "@/components/fleet-map"
import { requireRole } from "@/lib/session"
import { db } from "@/lib/db"
import { truckLocations, trucks, drivers, trips, chemicalLoads, user } from "@/lib/schema"
import { eq, desc, and, inArray, sql } from "drizzle-orm"
import dynamic from "next/dynamic"

// Leaflet requires the browser — disable SSR
const FleetMap = dynamic(
  () => import("@/components/fleet-map").then((m) => m.FleetMap),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading map…</div> }
)

async function getLatestLocations(): Promise<TruckLocation[]> {
  const latestIds = db
    .select({
      id: sql<string>`DISTINCT ON (${truckLocations.truckId}) ${truckLocations.id}`,
    })
    .from(truckLocations)
    .orderBy(truckLocations.truckId, desc(truckLocations.recordedAt))
    .as("latest_ids")

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
}

export default async function MapPage() {
  await requireRole(["admin", "dispatcher"])
  const initialLocations = await getLatestLocations()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="p-4 pb-2 shrink-0">
        <h1 className="text-xl font-bold">Live Fleet Map</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Truck positions update every 30 s · Click a pin for details
        </p>
      </div>

      {initialLocations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No truck locations yet. Drivers need an active trip with GPS enabled.
        </div>
      ) : (
        <div className="flex-1 px-4 pb-4">
          <FleetMap initialLocations={initialLocations} />
        </div>
      )}
    </div>
  )
}
