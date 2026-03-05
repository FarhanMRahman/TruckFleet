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
import type { Truck } from "@/lib/schema"

const VEHICLE_TYPES = [
  { value: "tanker", label: "Tanker" },
  { value: "hazmat", label: "HazMat Truck" },
  { value: "flatbed", label: "Flatbed" },
  { value: "refrigerated", label: "Refrigerated" },
]

const STATUSES = [
  { value: "available", label: "Available" },
  { value: "on_trip", label: "On Trip" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inactive", label: "Inactive" },
]

type FormValues = {
  name: string
  plate: string
  type: string
  status: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Truck | null
  onSuccess: () => void
}

export function TruckModal({ open, onOpenChange, editing, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: "",
      plate: "",
      type: "",
      status: "available",
    },
  })

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? {
              name: editing.name,
              plate: editing.plate,
              type: editing.type,
              status: editing.status,
            }
          : { name: "", plate: "", type: "", status: "available" }
      )
    }
  }, [open, editing, reset])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const url = editing ? `/api/admin/trucks/${editing.id}` : "/api/admin/trucks"
      const method = editing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Something went wrong")
        return
      }

      toast.success(editing ? "Truck updated" : "Truck added")
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Truck" : "Add Truck"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="name">Truck Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
              placeholder="e.g. Unit 42"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Plate */}
          <div className="space-y-1">
            <Label htmlFor="plate">License Plate *</Label>
            <Input
              id="plate"
              {...register("plate", { required: "Plate number is required" })}
              placeholder="e.g. ABC-1234"
            />
            {errors.plate && (
              <p className="text-xs text-destructive">{errors.plate.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1">
            <Label>Vehicle Type *</Label>
            <Controller
              name="type"
              control={control}
              rules={{ required: "Vehicle type is required" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-xs text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Status *</Label>
            <Controller
              name="status"
              control={control}
              rules={{ required: "Status is required" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && (
              <p className="text-xs text-destructive">{errors.status.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editing ? "Save Changes" : "Add Truck"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
