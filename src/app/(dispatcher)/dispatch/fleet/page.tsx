"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Truck, Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type ActiveTrip = {
  truckId: string | null
  driverId: string | null
  status: string
  origin: string
  destination: string
  scheduledAt: string | null
}

type TruckRow = {
  id: string
  name: string
  plate: string
  type: string
  status: string
  activeTrip: ActiveTrip | null
}

type DriverRow = {
  id: string
  userId: string
  licenseNumber: string
  certifications: string[]
  status: string
  userName: string | null
  userEmail: string | null
  activeTrip: ActiveTrip | null
}

const TRUCK_STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  on_trip: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const DRIVER_STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  on_shift: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  driving: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivering: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  off_duty: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const TRUCK_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  on_trip: "On Trip",
  maintenance: "Maintenance",
  inactive: "Inactive",
}

const DRIVER_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  on_shift: "On Shift",
  driving: "Driving",
  delivering: "Delivering",
  off_duty: "Off Duty",
}

const TYPE_LABELS: Record<string, string> = {
  tanker: "Tanker",
  hazmat: "HazMat",
  flatbed: "Flatbed",
  refrigerated: "Refrigerated",
}

const CERT_LABELS: Record<string, string> = {
  hazmat: "HazMat",
  tanker: "Tanker",
  twic: "TWIC",
  acid: "Acid",
  compressed_gas: "Comp. Gas",
  explosives_precursor: "Explosives",
}

const TRIP_STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export default function FleetStatusPage() {
  const [trucks, setTrucks] = useState<TruckRow[]>([])
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchFleet(quiet = false) {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/dispatch/fleet")
      const data = await res.json()
      setTrucks(data.trucks)
      setDrivers(data.drivers)
    } catch {
      toast.error("Failed to load fleet status")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchFleet() }, [])

  const availableTrucks = trucks.filter((t) => t.status === "available")
  const busyTrucks = trucks.filter((t) => t.status !== "available")
  const availableDrivers = drivers.filter((d) => d.status === "available" || d.status === "off_duty")
  const busyDrivers = drivers.filter((d) => d.status !== "available" && d.status !== "off_duty")

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground py-24">Loading fleet status...</div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Fleet Status
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live availability of trucks and drivers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchFleet(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Available Trucks", value: availableTrucks.length, color: "text-green-600" },
          { label: "Trucks On Trip", value: busyTrucks.filter((t) => t.activeTrip).length, color: "text-blue-600" },
          { label: "Available Drivers", value: availableDrivers.length, color: "text-green-600" },
          { label: "Drivers On Trip", value: busyDrivers.filter((d) => d.activeTrip).length, color: "text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Trucks */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5" /> Trucks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {trucks.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-full">No trucks in the fleet.</p>
          )}
          {trucks.map((truck) => (
            <div key={truck.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{truck.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{truck.plate}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${TRUCK_STATUS_STYLES[truck.status] ?? ""}`}>
                  {TRUCK_STATUS_LABELS[truck.status] ?? truck.status}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">{TYPE_LABELS[truck.type] ?? truck.type}</Badge>
              {truck.activeTrip && (
                <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
                  <p className="font-medium text-foreground">
                    {TRIP_STATUS_LABELS[truck.activeTrip.status] ?? truck.activeTrip.status}
                  </p>
                  <p>{truck.activeTrip.origin} → {truck.activeTrip.destination}</p>
                  {truck.activeTrip.scheduledAt && (
                    <p>Scheduled {formatDate(truck.activeTrip.scheduledAt)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Drivers */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" /> Drivers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {drivers.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-full">No driver profiles found.</p>
          )}
          {drivers.map((driver) => (
            <div key={driver.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{driver.userName ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{driver.userEmail}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${DRIVER_STATUS_STYLES[driver.status] ?? ""}`}>
                  {DRIVER_STATUS_LABELS[driver.status] ?? driver.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{driver.licenseNumber}</p>
              {driver.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {driver.certifications.map((c) => (
                    <Badge key={c} variant="outline" className="text-xs">
                      {CERT_LABELS[c] ?? c}
                    </Badge>
                  ))}
                </div>
              )}
              {driver.activeTrip && (
                <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
                  <p className="font-medium text-foreground">
                    {TRIP_STATUS_LABELS[driver.activeTrip.status] ?? driver.activeTrip.status}
                  </p>
                  <p>{driver.activeTrip.origin} → {driver.activeTrip.destination}</p>
                  {driver.activeTrip.scheduledAt && (
                    <p>Scheduled {formatDate(driver.activeTrip.scheduledAt)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
