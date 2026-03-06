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

const CERTIFICATIONS = [
  { value: "hazmat", label: "HazMat Endorsement" },
  { value: "tanker", label: "Tanker Endorsement" },
  { value: "twic", label: "TWIC Card" },
  { value: "acid", label: "Acid/Corrosive Handling" },
  { value: "compressed_gas", label: "Compressed Gas" },
  { value: "explosives_precursor", label: "Explosives Precursor" },
]

const STATUSES = [
  { value: "available", label: "Available" },
  { value: "on_shift", label: "On Shift" },
  { value: "driving", label: "Driving" },
  { value: "delivering", label: "Delivering" },
  { value: "off_duty", label: "Off Duty" },
]

type DriverRow = {
  id: string
  userId: string
  licenseNumber: string
  certifications: string[]
  status: string
  userName: string | null
  userEmail: string | null
}

type UserOption = { id: string; name: string; email: string }

type FormValues = {
  userId: string
  licenseNumber: string
  certifications: string[]
  status: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: DriverRow | null
  onSuccess: () => void
}

export function DriverModal({ open, onOpenChange, editing, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([])

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      userId: "",
      licenseNumber: "",
      certifications: [],
      status: "available",
    },
  })

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? {
              userId: editing.userId,
              licenseNumber: editing.licenseNumber,
              certifications: editing.certifications,
              status: editing.status,
            }
          : { userId: "", licenseNumber: "", certifications: [], status: "available" }
      )
      if (!editing) {
        fetch("/api/admin/users/without-driver")
          .then((r) => r.json())
          .then(setAvailableUsers)
          .catch(() => toast.error("Failed to load users"))
      }
    }
  }, [open, editing, reset])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const url = editing ? `/api/admin/drivers/${editing.id}` : "/api/admin/drivers"
      const method = editing ? "PUT" : "POST"
      const body = editing
        ? { licenseNumber: values.licenseNumber, certifications: values.certifications, status: values.status }
        : values

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Something went wrong")
        return
      }

      toast.success(editing ? "Driver profile updated" : "Driver profile created")
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Driver Profile" : "Add Driver Profile"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User (add mode only) */}
          {editing ? (
            <div className="space-y-1">
              <Label>User</Label>
              <p className="text-sm text-muted-foreground">
                {editing.userName} ({editing.userEmail})
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <Label>User *</Label>
              <Controller
                name="userId"
                control={control}
                rules={{ required: "User is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          No users without a driver profile
                        </SelectItem>
                      ) : (
                        availableUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} — {u.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.userId && (
                <p className="text-xs text-destructive">{errors.userId.message}</p>
              )}
            </div>
          )}

          {/* License Number */}
          <div className="space-y-1">
            <Label htmlFor="licenseNumber">License Number *</Label>
            <Input
              id="licenseNumber"
              {...register("licenseNumber", { required: "License number is required" })}
              placeholder="e.g. DL-123456"
            />
            {errors.licenseNumber && (
              <p className="text-xs text-destructive">{errors.licenseNumber.message}</p>
            )}
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <Label>Certifications</Label>
            <Controller
              name="certifications"
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
              {submitting ? "Saving..." : editing ? "Save Changes" : "Add Driver"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
