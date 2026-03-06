"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TripCreateModal } from "@/components/dispatch/trip-create-modal"
import type { ChemicalLoad } from "@/lib/schema"

type TripRow = {
  id: string
  status: string
  origin: string
  destination: string
  scheduledAt: string | null
  truckName: string | null
  truckPlate: string | null
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

const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
  assigned: [
    { value: "in_progress", label: "Mark In Progress" },
    { value: "cancelled", label: "Cancel Trip" },
  ],
  in_progress: [
    { value: "delivered", label: "Mark Delivered" },
    { value: "cancelled", label: "Cancel Trip" },
  ],
}

export default function TripsPage() {
  const [tripList, setTripList] = useState<TripRow[]>([])
  const [loads, setLoads] = useState<ChemicalLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [cancelling, setCancelling] = useState<TripRow | null>(null)

  async function fetchTrips() {
    setLoading(true)
    try {
      const [tripsRes, loadsRes] = await Promise.all([
        fetch("/api/dispatch/trips"),
        fetch("/api/admin/chemical-loads"),
      ])
      setTripList(await tripsRes.json())
      setLoads(await loadsRes.json())
    } catch {
      toast.error("Failed to load trips")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTrips() }, [])

  async function updateStatus(tripId: string, status: string) {
    if (status === "cancelled") {
      const trip = tripList.find((t) => t.id === tripId)
      if (trip) { setCancelling(trip); return }
    }
    await patchStatus(tripId, status)
  }

  async function patchStatus(tripId: string, status: string) {
    try {
      const res = await fetch(`/api/dispatch/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Trip marked as ${STATUS_LABELS[status]}`)
      fetchTrips()
    } catch {
      toast.error("Failed to update trip status")
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—"
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Trips
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage dispatch trips across the fleet.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Trip
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Load</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Truck</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tripList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No trips yet.</p>
                  <p className="text-xs mt-1">Create your first trip to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              tripList.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{trip.loadName ?? "—"}</p>
                      {trip.loadHazardClass && (
                        <p className="text-xs text-muted-foreground">Class {trip.loadHazardClass}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{trip.origin}</p>
                      <p className="text-muted-foreground">→ {trip.destination}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{trip.truckName ?? "—"}</p>
                      {trip.truckPlate && (
                        <p className="text-xs font-mono text-muted-foreground">{trip.truckPlate}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{trip.driverName ?? "—"}</TableCell>
                  <TableCell className="text-sm">{formatDate(trip.scheduledAt)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[trip.status] ?? ""}`}>
                      {STATUS_LABELS[trip.status] ?? trip.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {NEXT_STATUSES[trip.status] ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            Update <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {NEXT_STATUSES[trip.status].map((next, i) => (
                            <>
                              {i > 0 && <DropdownMenuSeparator key={`sep-${i}`} />}
                              <DropdownMenuItem
                                key={next.value}
                                onClick={() => updateStatus(trip.id, next.value)}
                                className={next.value === "cancelled" ? "text-destructive" : ""}
                              >
                                {next.label}
                              </DropdownMenuItem>
                            </>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Modal */}
      <TripCreateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        loads={loads}
        onSuccess={() => {
          setModalOpen(false)
          fetchTrips()
        }}
      />

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelling} onOpenChange={(open) => !open && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              The trip from <strong>{cancelling?.origin}</strong> to <strong>{cancelling?.destination}</strong> will be marked as cancelled.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Trip</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { patchStatus(cancelling!.id, "cancelled"); setCancelling(null) }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
