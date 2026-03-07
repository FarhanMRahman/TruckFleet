"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle, ChevronLeft, Clock, Timer, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type DriverHos = {
  driverId: string
  driverName: string
  driverEmail: string
  driverStatus: string
  licenseNumber: string
  drivingHours: number
  onDutyHours: number
  isOnShift: boolean
  flags: string[]
}

const DRIVER_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  on_shift: "On Shift",
  driving: "Driving",
  delivering: "Delivering",
  off_duty: "Off Duty",
}

const DRIVER_STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  on_shift: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  driving: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivering: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  off_duty: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

function HosBar({ value, max, warn, danger }: { value: number; max: number; warn: number; danger: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = value >= danger ? "bg-red-500" : value >= warn ? "bg-orange-400" : "bg-green-500"
  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function HosCompliancePage() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<DriverHos[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dispatch/hos")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDrivers(data) })
      .catch(() => toast.error("Failed to load HOS data"))
      .finally(() => setLoading(false))
  }, [])

  const flagged = drivers.filter((d) => d.flags.length > 0)
  const clean = drivers.filter((d) => d.flags.length === 0)

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div>
        <h1 className="text-2xl font-bold">HOS Compliance</h1>
        <p className="text-muted-foreground text-sm mt-1">Hours of service — 7-day rolling window. Limits: 11h driving / 14h on-duty.</p>
      </div>

      {loading ? (
        <div className="border rounded-xl p-10 text-center text-muted-foreground text-sm">Loading...</div>
      ) : drivers.length === 0 ? (
        <div className="border rounded-xl p-10 text-center text-muted-foreground text-sm">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No driver profiles found.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Flagged drivers */}
          {flagged.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Needs Attention ({flagged.length})
                </h2>
              </div>
              <div className="space-y-2">
                {flagged.map((d) => (
                  <DriverHosCard key={d.driverId} driver={d} />
                ))}
              </div>
            </div>
          )}

          {/* All-clear drivers */}
          {clean.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Within Limits ({clean.length})
                </h2>
              </div>
              <div className="space-y-2">
                {clean.map((d) => (
                  <DriverHosCard key={d.driverId} driver={d} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DriverHosCard({ driver }: { driver: DriverHos }) {
  const hasCritical = driver.flags.some((f) => f.includes("exceeded"))
  return (
    <div className={`border rounded-xl p-4 space-y-3 ${hasCritical ? "border-red-300 dark:border-red-800" : driver.flags.length > 0 ? "border-orange-300 dark:border-orange-800" : ""}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-sm">{driver.driverName}</p>
          <p className="text-xs text-muted-foreground">{driver.licenseNumber}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DRIVER_STATUS_COLORS[driver.driverStatus] ?? ""}`}>
            {DRIVER_STATUS_LABELS[driver.driverStatus] ?? driver.driverStatus}
          </span>
          {driver.isOnShift && (
            <Badge variant="outline" className="text-xs">On shift</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><Timer className="h-3 w-3" /> Driving</span>
            <span className={`font-medium ${driver.drivingHours >= 11 ? "text-red-600" : driver.drivingHours >= 10 ? "text-orange-500" : ""}`}>
              {driver.drivingHours}h / 11h
            </span>
          </div>
          <HosBar value={driver.drivingHours} max={11} warn={10} danger={11} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> On-Duty</span>
            <span className={`font-medium ${driver.onDutyHours >= 14 ? "text-red-600" : driver.onDutyHours >= 13 ? "text-orange-500" : ""}`}>
              {driver.onDutyHours}h / 14h
            </span>
          </div>
          <HosBar value={driver.onDutyHours} max={14} warn={13} danger={14} />
        </div>
      </div>

      {driver.flags.length > 0 && (
        <div className="space-y-1">
          {driver.flags.map((flag) => (
            <div key={flag} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 ${
              flag.includes("exceeded")
                ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                : "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
            }`}>
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {flag}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
