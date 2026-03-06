"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { MapPin, Truck, Clock, ChevronLeft, ShieldAlert, FileText, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TripMessageThread } from "@/components/trip-message-thread"

type TripDetail = {
  id: string
  status: string
  origin: string
  destination: string
  scheduledAt: string | null
  startedAt: string | null
  deliveredAt: string | null
  notes: string | null
  truckName: string | null
  truckPlate: string | null
  truckType: string | null
  driverName: string | null
  loadName: string | null
  loadHazardClass: string | null
  loadUnNumber: string | null
  loadHandlingNotes: string | null
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", assigned: "Assigned", in_progress: "In Progress",
  delivered: "Delivered", cancelled: "Cancelled",
}

const TYPE_LABELS: Record<string, string> = {
  tanker: "Tanker", hazmat: "HazMat Truck", flatbed: "Flatbed", refrigerated: "Refrigerated",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export default function DispatchTripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>("")

  useEffect(() => {
    fetch("/api/auth/get-session").then((r) => r.json()).then((s) => {
      if (s?.user?.id) setCurrentUserId(s.user.id)
    })
  }, [])

  useEffect(() => {
    // Re-use the dispatch trips list API and find by id, or use a dedicated endpoint
    fetch("/api/dispatch/trips")
      .then((r) => r.json())
      .then((rows: TripDetail[]) => {
        const found = rows.find((t) => t.id === id)
        if (!found) { toast.error("Trip not found"); router.push("/dispatch/trips") }
        else setTrip(found)
      })
      .catch(() => { toast.error("Failed to load trip"); router.push("/dispatch/trips") })
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) return <div className="p-6 text-center text-muted-foreground pt-16">Loading...</div>
  if (!trip) return null

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Trips
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{trip.loadName ?? "Trip Detail"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{trip.origin} → {trip.destination}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${STATUS_STYLES[trip.status] ?? ""}`}>
          {STATUS_LABELS[trip.status] ?? trip.status}
        </span>
      </div>

      {/* Details */}
      <section className="border rounded-xl divide-y">
        <div className="p-4 flex items-start gap-3">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Route</p>
            <p><span className="text-muted-foreground">From</span> <span className="font-medium">{trip.origin}</span></p>
            <p><span className="text-muted-foreground">To</span> <span className="font-medium">{trip.destination}</span></p>
          </div>
        </div>
        <div className="p-4 flex items-start gap-3">
          <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Schedule</p>
            <p><span className="text-muted-foreground">Scheduled</span> <span className="font-medium">{formatDate(trip.scheduledAt)}</span></p>
            {trip.startedAt && <p><span className="text-muted-foreground">Started</span> <span className="font-medium">{formatDate(trip.startedAt)}</span></p>}
            {trip.deliveredAt && <p><span className="text-muted-foreground">Delivered</span> <span className="font-medium">{formatDate(trip.deliveredAt)}</span></p>}
          </div>
        </div>
        <div className="p-4 flex items-start gap-3">
          <Truck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Vehicle</p>
            <p className="font-medium">{trip.truckName ?? "—"}</p>
            {trip.truckPlate && <p className="text-muted-foreground font-mono text-xs">{trip.truckPlate} · {TYPE_LABELS[trip.truckType ?? ""] ?? trip.truckType}</p>}
          </div>
        </div>
        <div className="p-4 flex items-start gap-3">
          <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Driver</p>
            <p className="font-medium">{trip.driverName ?? "—"}</p>
          </div>
        </div>
        <div className="p-4 flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Chemical Load</p>
            <div className="flex flex-wrap gap-2">
              {trip.loadHazardClass && <Badge variant="outline">Class {trip.loadHazardClass}</Badge>}
              {trip.loadUnNumber && <Badge variant="outline">{trip.loadUnNumber}</Badge>}
            </div>
          </div>
        </div>
        {trip.loadHandlingNotes && (
          <div className="p-4 flex items-start gap-3">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Handling Notes</p>
              <p className="leading-relaxed">{trip.loadHandlingNotes}</p>
            </div>
          </div>
        )}
        {trip.notes && (
          <div className="p-4 flex items-start gap-3">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Dispatcher Notes</p>
              <p className="leading-relaxed">{trip.notes}</p>
            </div>
          </div>
        )}
      </section>

      {/* Messages */}
      {currentUserId && <TripMessageThread tripId={trip.id} currentUserId={currentUserId} />}
    </div>
  )
}
