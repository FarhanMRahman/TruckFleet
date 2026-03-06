"use client"

import dynamic from "next/dynamic"
import type { TruckLocation } from "@/components/fleet-map"

const FleetMap = dynamic(
  () => import("@/components/fleet-map").then((m) => m.FleetMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        Loading map…
      </div>
    ),
  }
)

export function FleetMapWrapper({ initialLocations }: { initialLocations: TruckLocation[] }) {
  return <FleetMap initialLocations={initialLocations} />
}
