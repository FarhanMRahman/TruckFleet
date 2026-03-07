"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MapPin, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

type TripRow = {
  id: string
  status: string
  origin: string
  destination: string
  scheduledAt: string | null
  loadName: string | null
  loadHazardClass: string | null
}

const STATUS_STYLES: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const STATUS_LABELS: Record<string, string> = {
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

export default function DriverTripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<TripRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/driver/trips")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTrips(data) })
      .catch(() => toast.error("Failed to load trips"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 text-center text-muted-foreground pt-16">Loading...</div>

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div>
        <h1 className="text-xl font-bold">All Trips</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{trips.length} trip{trips.length !== 1 ? "s" : ""} total</p>
      </div>

      {trips.length === 0 ? (
        <div className="border rounded-xl p-10 text-center text-muted-foreground text-sm">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No trips yet.
        </div>
      ) : (
        <div className="space-y-2">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/driver/trips/${trip.id}`}
              className="flex items-center justify-between border rounded-xl p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{trip.loadName ?? "Unknown load"}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[trip.status] ?? ""}`}>
                    {STATUS_LABELS[trip.status] ?? trip.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{trip.origin} → {trip.destination}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(trip.scheduledAt)}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
