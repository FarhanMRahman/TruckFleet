"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import type { ChemicalLoad, Truck } from "@/lib/schema"

type DriverOption = {
  id: string
  userId: string
  licenseNumber: string
  certifications: string[]
  status: string
  userName: string | null
  userEmail: string | null
}

type EligibleResources = {
  trucks: Truck[]
  drivers: DriverOption[]
  load: ChemicalLoad
}

type FormValues = {
  loadId: string
  truckId: string
  driverId: string
  origin: string
  destination: string
  scheduledAt: string
  notes: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  loads: ChemicalLoad[]
  onSuccess: () => void
}

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  on_shift: "On Shift",
  driving: "Driving",
  delivering: "Delivering",
  off_duty: "Off Duty",
  on_trip: "On Trip",
  maintenance: "Maintenance",
  inactive: "Inactive",
}

export function TripCreateModal({ open, onOpenChange, loads, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [resources, setResources] = useState<EligibleResources | null>(null)
  const [loadingResources, setLoadingResources] = useState(false)

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        loadId: "",
        truckId: "",
        driverId: "",
        origin: "",
        destination: "",
        scheduledAt: "",
        notes: "",
      },
    })

  const selectedLoadId = watch("loadId")

  // Reset truck/driver when load changes
  useEffect(() => {
    setValue("truckId", "")
    setValue("driverId", "")
    setResources(null)

    if (!selectedLoadId) return

    setLoadingResources(true)
    fetch(`/api/dispatch/eligible-resources?loadId=${selectedLoadId}`)
      .then((r) => r.json())
      .then(setResources)
      .catch(() => toast.error("Failed to load eligible trucks and drivers"))
      .finally(() => setLoadingResources(false))
  }, [selectedLoadId, setValue])

  useEffect(() => {
    if (open) {
      reset()
      setResources(null)
    }
  }, [open, reset])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/dispatch/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Something went wrong")
        return
      }
      toast.success("Trip created and driver notified")
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Trip</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Chemical Load */}
          <div className="space-y-1">
            <Label>Chemical Load *</Label>
            <Controller
              name="loadId"
              control={control}
              rules={{ required: "Chemical load is required" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chemical load" />
                  </SelectTrigger>
                  <SelectContent>
                    {loads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} — Class {l.hazardClass}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.loadId && <p className="text-xs text-destructive">{errors.loadId.message}</p>}
          </div>

          {/* Load info / requirements */}
          {resources?.load && (
            <div className="rounded-md border p-3 space-y-1 text-sm bg-muted/40">
              <p className="font-medium">{resources.load.name}</p>
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                <span>Hazard Class {resources.load.hazardClass}</span>
                {resources.load.unNumber && <span>· {resources.load.unNumber}</span>}
                <span>· Requires {resources.load.requiredVehicleType}</span>
              </div>
              {resources.load.requiredCertifications.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {resources.load.requiredCertifications.map((c) => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Truck */}
          <div className="space-y-1">
            <Label>Truck *</Label>
            {loadingResources ? (
              <p className="text-xs text-muted-foreground">Loading eligible trucks...</p>
            ) : (
              <Controller
                name="truckId"
                control={control}
                rules={{ required: "Truck is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!resources}>
                    <SelectTrigger>
                      <SelectValue placeholder={resources ? "Select truck" : "Select a load first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {resources?.trucks.length === 0 ? (
                        <SelectItem value="_none" disabled>No eligible trucks available</SelectItem>
                      ) : (
                        resources?.trucks.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.plate}) — {STATUS_LABELS[t.status] ?? t.status}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {resources?.trucks.length === 0 && selectedLoadId && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                No trucks of the required type are available
              </p>
            )}
            {errors.truckId && <p className="text-xs text-destructive">{errors.truckId.message}</p>}
          </div>

          {/* Driver */}
          <div className="space-y-1">
            <Label>Driver *</Label>
            {loadingResources ? (
              <p className="text-xs text-muted-foreground">Loading eligible drivers...</p>
            ) : (
              <Controller
                name="driverId"
                control={control}
                rules={{ required: "Driver is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!resources}>
                    <SelectTrigger>
                      <SelectValue placeholder={resources ? "Select driver" : "Select a load first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {resources?.drivers.length === 0 ? (
                        <SelectItem value="_none" disabled>No certified drivers available</SelectItem>
                      ) : (
                        resources?.drivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.userName} — {STATUS_LABELS[d.status] ?? d.status}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {resources?.drivers.length === 0 && selectedLoadId && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                No drivers hold the required certifications
              </p>
            )}
            {errors.driverId && <p className="text-xs text-destructive">{errors.driverId.message}</p>}
          </div>

          {/* Origin */}
          <div className="space-y-1">
            <Label htmlFor="origin">Origin *</Label>
            <Input
              id="origin"
              {...register("origin", { required: "Origin is required" })}
              placeholder="e.g. Houston, TX"
            />
            {errors.origin && <p className="text-xs text-destructive">{errors.origin.message}</p>}
          </div>

          {/* Destination */}
          <div className="space-y-1">
            <Label htmlFor="destination">Destination *</Label>
            <Input
              id="destination"
              {...register("destination", { required: "Destination is required" })}
              placeholder="e.g. Dallas, TX"
            />
            {errors.destination && <p className="text-xs text-destructive">{errors.destination.message}</p>}
          </div>

          {/* Scheduled At */}
          <div className="space-y-1">
            <Label htmlFor="scheduledAt">Scheduled Departure *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              {...register("scheduledAt", { required: "Scheduled time is required" })}
            />
            {errors.scheduledAt && <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Any special instructions..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Trip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
