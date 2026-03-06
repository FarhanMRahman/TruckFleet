import { requireRole } from "@/lib/session"
import { fetchLatestLocations } from "@/app/api/dispatch/locations/route"
import { FleetMapWrapper } from "@/components/fleet-map-wrapper"

export default async function MapPage() {
  await requireRole(["admin", "dispatcher"])
  const initialLocations = await fetchLatestLocations()

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
          <FleetMapWrapper initialLocations={initialLocations} />
        </div>
      )}
    </div>
  )
}
