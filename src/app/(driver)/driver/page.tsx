"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { MapPin, Package, CheckCircle, Clock, ChevronRight, Truck, Circle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TripRow = {
  id: string
  status: string
  origin: string
  destination: string
  scheduledAt: string | null
  startedAt: string | null
  truckName: string | null
  truckPlate: string | null
  loadName: string | null
  loadHazardClass: string | null
  loadUnNumber: string | null
  loadHandlingNotes: string | null
}

type HomeData = {
  driverProfile: { id: string; status: string; licenseNumber: string; certifications: string[] } | null
  activeTrip: TripRow | null
  upcomingTrips: TripRow[]
  stats: { completed: number; total: number }
}

const TRIP_STATUS_STYLES: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
}

const TRIP_STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
}

const DRIVER_STATUS_OPTIONS = [
  { value: "available", label: "Available", color: "text-green-600" },
  { value: "on_shift", label: "On Shift", color: "text-blue-600" },
  { value: "driving", label: "Driving", color: "text-purple-600" },
  { value: "delivering", label: "Delivering", color: "text-orange-500" },
  { value: "off_duty", label: "Off Duty", color: "text-gray-500" },
]

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function DriverHomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetch("/api/driver/home")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Failed to load your trips"))
      .finally(() => setLoading(false))
  }, [])

  async function updateDriverStatus(status: string) {
    setUpdatingStatus(true)
    try {
      const res = await fetch("/api/driver/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setData((prev) => prev ? { ...prev, driverProfile: prev.driverProfile ? { ...prev.driverProfile, status } : null } : prev)
      toast.success(`Status updated to ${DRIVER_STATUS_OPTIONS.find((s) => s.value === status)?.label}`)
    } catch {
      toast.error("Failed to update status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground pt-16">Loading...</div>
  }

  const { activeTrip, upcomingTrips, stats, driverProfile } = data ?? {}

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">My Trips</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Here&apos;s your day at a glance.</p>
      </div>

      {/* Driver status selector */}
      {driverProfile && (() => {
        const current = DRIVER_STATUS_OPTIONS.find((s) => s.value === driverProfile.status)
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={updatingStatus} className="gap-2">
                <Circle className={`h-2.5 w-2.5 fill-current ${current?.color ?? ""}`} />
                {current?.label ?? driverProfile.status}
                <span className="text-xs text-muted-foreground ml-1">· My Status</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {DRIVER_STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => updateDriverStatus(opt.value)}
                  className={`gap-2 ${opt.value === driverProfile.status ? "font-semibold" : ""}`}
                >
                  <Circle className={`h-2.5 w-2.5 fill-current ${opt.color}`} />
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      })()}

      {/* No driver profile */}
      {!driverProfile && (
        <div className="border rounded-xl p-5 text-center text-muted-foreground text-sm space-y-2">
          <Truck className="h-8 w-8 mx-auto opacity-30" />
          <p>No driver profile found for your account.</p>
          <p className="text-xs">Ask an admin to create your driver profile.</p>
        </div>
      )}

      {/* Active trip card */}
      {driverProfile && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Trip</h2>
          {activeTrip ? (
            <Link href={`/driver/trips/${activeTrip.id}`} className="block border rounded-xl p-5 space-y-3 hover:bg-muted/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold">{activeTrip.loadName ?? "Unknown load"}</p>
                  {activeTrip.loadHazardClass && (
                    <Badge variant="outline" className="text-xs">Class {activeTrip.loadHazardClass}</Badge>
                  )}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${TRIP_STATUS_STYLES[activeTrip.status] ?? ""}`}>
                  {TRIP_STATUS_LABELS[activeTrip.status] ?? activeTrip.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{activeTrip.origin}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{activeTrip.destination}</span>
              </div>
              {activeTrip.truckName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>{activeTrip.truckName} ({activeTrip.truckPlate})</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Scheduled {formatDate(activeTrip.scheduledAt)}</span>
              </div>
              <div className="flex items-center justify-end gap-1 text-xs text-primary font-medium">
                View details <ChevronRight className="h-3 w-3" />
              </div>
            </Link>
          ) : (
            <div className="border rounded-xl p-5 text-center text-muted-foreground text-sm">
              <MapPin className="h-6 w-6 mx-auto mb-2 opacity-30" />
              No active trip right now.
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {driverProfile && (
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Package className="h-3.5 w-3.5" />
              <span>Total Trips</span>
            </div>
            <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
          </div>
          <div className="border rounded-lg p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Completed</span>
            </div>
            <p className="text-2xl font-bold">{stats?.completed ?? 0}</p>
          </div>
        </div>
      )}

      {/* Upcoming trips */}
      {driverProfile && upcomingTrips && upcomingTrips.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</h2>
          <div className="space-y-2">
            {upcomingTrips.map((trip) => (
              <Link key={trip.id} href={`/driver/trips/${trip.id}`} className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/40 transition-colors">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-medium text-sm truncate">{trip.loadName ?? "Unknown load"}</p>
                  <p className="text-xs text-muted-foreground">{trip.origin} → {trip.destination}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(trip.scheduledAt)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* View all trips */}
      {driverProfile && (
        <Button variant="outline" className="w-full" asChild>
          <Link href="/driver/trips">View All Trips</Link>
        </Button>
      )}
    </div>
  )
}
