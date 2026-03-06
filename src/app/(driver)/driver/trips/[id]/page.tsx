"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  MapPin, Truck, Clock, ChevronLeft, ExternalLink,
  ShieldAlert, FileText, Package
} from "lucide-react"
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
  loadName: string | null
  loadHazardClass: string | null
  loadUnNumber: string | null
  loadHandlingNotes: string | null
  loadRequiredCertifications: string[]
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

const CERT_LABELS: Record<string, string> = {
  hazmat: "HazMat Endorsement",
  tanker: "Tanker Endorsement",
  twic: "TWIC Card",
  acid: "Acid/Corrosive Handling",
  compressed_gas: "Compressed Gas",
  explosives_precursor: "Explosives Precursor",
}

const TYPE_LABELS: Record<string, string> = {
  tanker: "Tanker",
  hazmat: "HazMat Truck",
  flatbed: "Flatbed",
  refrigerated: "Refrigerated",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function mapsUrl(origin: string, destination: string) {
  const q = encodeURIComponent(`${origin} to ${destination}`)
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
}

export default function TripDetailPage() {
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
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetch(`/api/driver/trips/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setTrip)
      .catch(() => {
        toast.error("Trip not found")
        router.push("/driver")
      })
      .finally(() => setLoading(false))
  }, [id, router])

  async function updateTripStatus(status: "in_progress" | "delivered") {
    setUpdating(true)
    try {
      const res = await fetch(`/api/driver/trips/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setTrip((prev) => prev ? { ...prev, status, ...(status === "in_progress" ? { startedAt: new Date().toISOString() } : { deliveredAt: new Date().toISOString() }) } : prev)
      toast.success(status === "in_progress" ? "Trip started!" : "Trip marked as delivered!")
    } catch {
      toast.error("Failed to update trip status")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground pt-16">Loading...</div>
  }

  if (!trip) return null

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{trip.loadName ?? "Trip Detail"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{trip.origin} → {trip.destination}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${STATUS_STYLES[trip.status] ?? ""}`}>
          {STATUS_LABELS[trip.status] ?? trip.status}
        </span>
      </div>

      {/* Navigation button */}
      <a
        href={mapsUrl(trip.origin, trip.destination)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        <MapPin className="h-4 w-4" />
        Open in Google Maps
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>

      {/* Trip action buttons */}
      {trip.status === "assigned" && (
        <Button
          className="w-full"
          onClick={() => updateTripStatus("in_progress")}
          disabled={updating}
        >
          {updating ? "Updating..." : "Start Trip"}
        </Button>
      )}
      {trip.status === "in_progress" && (
        <Button
          className="w-full"
          onClick={() => updateTripStatus("delivered")}
          disabled={updating}
        >
          {updating ? "Updating..." : "Mark as Delivered"}
        </Button>
      )}

      {/* Route & Schedule */}
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
        {trip.truckName && (
          <div className="p-4 flex items-start gap-3">
            <Truck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Vehicle</p>
              <p className="font-medium">{trip.truckName}</p>
              <p className="text-muted-foreground font-mono text-xs">{trip.truckPlate} · {TYPE_LABELS[trip.truckType ?? ""] ?? trip.truckType}</p>
            </div>
          </div>
        )}
      </section>

      {/* Chemical load details */}
      <section className="border rounded-xl divide-y">
        <div className="p-4 flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-2 text-sm flex-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Chemical Load</p>
            <p className="font-semibold">{trip.loadName}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Class {trip.loadHazardClass}</Badge>
              {trip.loadUnNumber && <Badge variant="outline">{trip.loadUnNumber}</Badge>}
            </div>
            {trip.loadRequiredCertifications?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Required certifications:</p>
                <div className="flex flex-wrap gap-1">
                  {trip.loadRequiredCertifications.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs">
                      {CERT_LABELS[c] ?? c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {trip.loadHandlingNotes && (
          <div className="p-4 flex items-start gap-3">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Handling Notes</p>
              <p className="text-sm leading-relaxed">{trip.loadHandlingNotes}</p>
            </div>
          </div>
        )}
      </section>

      {/* Trip notes */}
      {trip.notes && (
        <section className="border rounded-xl p-4 flex items-start gap-3">
          <Package className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Dispatcher Notes</p>
            <p className="leading-relaxed">{trip.notes}</p>
          </div>
        </section>
      )}

      {/* Messages */}
      {currentUserId && <TripMessageThread tripId={trip.id} currentUserId={currentUserId} />}
    </div>
  )
}
