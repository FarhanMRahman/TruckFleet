"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { MapPin, Truck, Users, Clock, Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type Stats = {
  activeTrips: number
  scheduledToday: number
  availableTrucks: number
  availableDrivers: number
}

type TripRow = {
  id: string
  status: string
  origin: string
  destination: string
  scheduledAt: string | null
  truckName: string | null
  driverName: string | null
  loadName: string | null
  loadHazardClass: string | null
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  assigned: "Assigned",
  in_progress: "In Progress",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export default function DispatchDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentTrips, setRecentTrips] = useState<TripRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dispatch/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats)
        setRecentTrips(data.recentTrips)
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispatch Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fleet overview and recent activity.
          </p>
        </div>
        <Button asChild>
          <Link href="/dispatch/trips">
            <Plus className="h-4 w-4 mr-2" />
            New Trip
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Active Trips",
            value: stats?.activeTrips,
            icon: MapPin,
            color: "text-blue-600",
            href: "/dispatch/trips",
          },
          {
            label: "Scheduled Today",
            value: stats?.scheduledToday,
            icon: Clock,
            color: "text-orange-500",
            href: "/dispatch/trips",
          },
          {
            label: "Available Trucks",
            value: stats?.availableTrucks,
            icon: Truck,
            color: "text-green-600",
            href: "/dispatch/fleet",
          },
          {
            label: "Available Drivers",
            value: stats?.availableDrivers,
            icon: Users,
            color: "text-green-600",
            href: "/dispatch/fleet",
          },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="border rounded-lg p-4 space-y-2 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
            <p className={`text-3xl font-bold ${color}`}>
              {loading ? "—" : (value ?? 0)}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Trips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Trips</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dispatch/trips" className="flex items-center gap-1 text-sm">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : recentTrips.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No trips yet.</p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/dispatch/trips">Create your first trip</Link>
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{trip.loadName ?? "Unknown load"}</span>
                    {trip.loadHazardClass && (
                      <span className="text-xs text-muted-foreground">Class {trip.loadHazardClass}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {trip.origin} → {trip.destination}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trip.truckName ?? "No truck"} · {trip.driverName ?? "No driver"} · {formatDate(trip.scheduledAt)}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_STYLES[trip.status] ?? ""}`}>
                  {STATUS_LABELS[trip.status] ?? trip.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
