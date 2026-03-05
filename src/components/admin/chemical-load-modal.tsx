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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { ChemicalLoad } from "@/lib/schema"

const HAZARD_CLASSES = [
  { value: "1", label: "Class 1 — Explosives" },
  { value: "2.1", label: "Class 2.1 — Flammable Gas" },
  { value: "2.2", label: "Class 2.2 — Non-Flammable Gas" },
  { value: "2.3", label: "Class 2.3 — Toxic Gas" },
  { value: "3", label: "Class 3 — Flammable Liquid" },
  { value: "4.1", label: "Class 4.1 — Flammable Solid" },
  { value: "4.2", label: "Class 4.2 — Spontaneously Combustible" },
  { value: "4.3", label: "Class 4.3 — Dangerous When Wet" },
  { value: "5.1", label: "Class 5.1 — Oxidizer" },
  { value: "5.2", label: "Class 5.2 — Organic Peroxide" },
  { value: "6.1", label: "Class 6.1 — Toxic" },
  { value: "6.2", label: "Class 6.2 — Infectious Substance" },
  { value: "7", label: "Class 7 — Radioactive" },
  { value: "8", label: "Class 8 — Corrosive" },
  { value: "9", label: "Class 9 — Miscellaneous" },
]

const VEHICLE_TYPES = [
  { value: "tanker", label: "Tanker" },
  { value: "hazmat", label: "HazMat Truck" },
  { value: "flatbed", label: "Flatbed" },
  { value: "refrigerated", label: "Refrigerated" },
]

const CERTIFICATIONS = [
  { value: "hazmat", label: "HazMat Endorsement" },
  { value: "tanker", label: "Tanker Endorsement" },
  { value: "twic", label: "TWIC Card" },
  { value: "acid", label: "Acid/Corrosive Handling" },
  { value: "compressed_gas", label: "Compressed Gas" },
  { value: "explosives_precursor", label: "Explosives Precursor" },
]

type FormValues = {
  name: string
  hazardClass: string
  unNumber: string
  requiredVehicleType: string
  requiredCertifications: string[]
  handlingNotes: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: ChemicalLoad | null
  onSuccess: () => void
}

export function ChemicalLoadModal({ open, onOpenChange, editing, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: "",
      hazardClass: "",
      unNumber: "",
      requiredVehicleType: "",
      requiredCertifications: [],
      handlingNotes: "",
    },
  })

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? {
              name: editing.name,
              hazardClass: editing.hazardClass,
              unNumber: editing.unNumber ?? "",
              requiredVehicleType: editing.requiredVehicleType,
              requiredCertifications: editing.requiredCertifications,
              handlingNotes: editing.handlingNotes ?? "",
            }
          : {
              name: "",
              hazardClass: "",
              unNumber: "",
              requiredVehicleType: "",
              requiredCertifications: [],
              handlingNotes: "",
            }
      )
    }
  }, [open, editing, reset])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const url = editing
        ? `/api/admin/chemical-loads/${editing.id}`
        : "/api/admin/chemical-loads"
      const method = editing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          hazardClass: values.hazardClass,
          unNumber: values.unNumber || null,
          requiredVehicleType: values.requiredVehicleType,
          requiredCertifications: values.requiredCertifications,
          handlingNotes: values.handlingNotes || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Something went wrong")
        return
      }

      toast.success(editing ? "Chemical load updated" : "Chemical load added")
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Chemical Load" : "Add Chemical Load"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="name">Chemical Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
              placeholder="e.g. Sulfuric Acid"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Hazard Class */}
          <div className="space-y-1">
            <Label>Hazard Class *</Label>
            <Controller
              name="hazardClass"
              control={control}
              rules={{ required: "Hazard class is required" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select DOT hazard class" />
                  </SelectTrigger>
                  <SelectContent>
                    {HAZARD_CLASSES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.hazardClass && (
              <p className="text-xs text-destructive">{errors.hazardClass.message}</p>
            )}
          </div>

          {/* UN Number */}
          <div className="space-y-1">
            <Label htmlFor="unNumber">UN Number</Label>
            <Input
              id="unNumber"
              {...register("unNumber")}
              placeholder="e.g. UN1830"
            />
          </div>

          {/* Required Vehicle Type */}
          <div className="space-y-1">
            <Label>Required Vehicle Type *</Label>
            <Controller
              name="requiredVehicleType"
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
            {errors.requiredVehicleType && (
              <p className="text-xs text-destructive">{errors.requiredVehicleType.message}</p>
            )}
          </div>

          {/* Required Certifications */}
          <div className="space-y-2">
            <Label>Required Driver Certifications</Label>
            <Controller
              name="requiredCertifications"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {CERTIFICATIONS.map((cert) => {
                    const checked = field.value.includes(cert.value)
                    return (
                      <label
                        key={cert.value}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val) => {
                            if (val) {
                              field.onChange([...field.value, cert.value])
                            } else {
                              field.onChange(field.value.filter((v) => v !== cert.value))
                            }
                          }}
                        />
                        {cert.label}
                      </label>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* Handling Notes */}
          <div className="space-y-1">
            <Label htmlFor="handlingNotes">Handling Notes</Label>
            <Textarea
              id="handlingNotes"
              {...register("handlingNotes")}
              placeholder="Special handling or storage instructions..."
              rows={3}
            />
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
              {submitting ? "Saving..." : editing ? "Save Changes" : "Add Load"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
