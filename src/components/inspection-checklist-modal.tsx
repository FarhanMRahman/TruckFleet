"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

const PRE_TRIP_ITEMS = [
  "Brakes functional",
  "Lights & signals working",
  "HazMat placard properly displayed",
  "Load secured and stable",
  "Fire extinguisher present & charged",
  "Emergency response kit onboard",
  "Tires inflated, no visible damage",
  "Shipping documents & manifest onboard",
]

const POST_TRIP_ITEMS = [
  "Load arrived without spills or leaks",
  "Truck exterior undamaged",
  "HazMat placards removed or updated",
  "All paperwork complete",
  "Fuel level documented",
  "Keys returned to dispatch",
]

type Props = {
  open: boolean
  onClose: () => void
  type: "pre" | "post"
  tripId: string
  onComplete: (newStatus: "in_progress" | "delivered") => void
}

export function InspectionChecklistModal({ open, onClose, type, tripId, onComplete }: Props) {
  const items = type === "pre" ? PRE_TRIP_ITEMS : POST_TRIP_ITEMS
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false))
  const [submitting, setSubmitting] = useState(false)

  const allChecked = checked.every(Boolean)

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  async function handleSubmit() {
    if (!allChecked) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/driver/trips/${tripId}/inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          items: items.map((item, i) => ({ item, checked: checked[i] })),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(type === "pre" ? "Pre-trip inspection complete — trip started!" : "Post-trip inspection complete — trip delivered!")
      onComplete(type === "pre" ? "in_progress" : "delivered")
      onClose()
    } catch {
      toast.error("Failed to submit inspection")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <DialogTitle>
              {type === "pre" ? "Pre-Trip Inspection" : "Post-Trip Inspection"}
            </DialogTitle>
          </div>
          <DialogDescription>
            Check each item before {type === "pre" ? "starting" : "completing"} the trip.
            All items must be confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {items.map((item, i) => (
            <label
              key={item}
              className="flex items-start gap-3 cursor-pointer select-none"
            >
              <Checkbox
                checked={checked[i] ?? false}
                onCheckedChange={() => toggle(i)}
                className="mt-0.5"
              />
              <span className="text-sm leading-snug">{item}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!allChecked || submitting}
            className="w-full"
          >
            {submitting
              ? "Submitting..."
              : type === "pre"
              ? "Complete & Start Trip"
              : "Complete & Mark Delivered"}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
