import { requireRole } from "@/lib/session"
import { WifiOff, Clock, CheckCircle } from "lucide-react"
import type { Alert } from "@/app/api/dispatch/alerts/route"
import { AlertsClient } from "@/components/alerts-client"

async function getAlerts(): Promise<Alert[]> {
  const { GET } = await import("@/app/api/dispatch/alerts/route")
  const res = await GET()
  return res.json()
}

export default async function AlertsPage() {
  await requireRole(["admin", "dispatcher"])
  const alerts = await getAlerts()

  const offline = alerts.filter((a) => a.type === "offline")
  const delays = alerts.filter((a) => a.type === "delay")

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Alerts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Offline trucks and overdue trips · refreshes every 60 s
        </p>
      </div>

      {alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <p className="text-sm font-medium">All clear — no active alerts</p>
        </div>
      )}

      {offline.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-destructive" />
            Offline Trucks ({offline.length})
          </h2>
          {offline.map((a) => {
            if (a.type !== "offline") return null
            return (
              <div key={a.truckId} className="border border-destructive/30 bg-destructive/5 rounded-xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{a.truckName}</span>
                  <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-medium">
                    {a.minutesSinceLastPing}m offline
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{a.truckPlate}</p>
                {a.driverName && <p className="text-sm text-muted-foreground">Driver: {a.driverName}</p>}
                <p className="text-xs text-muted-foreground">
                  Last ping: {new Date(a.lastPing).toLocaleString()}
                </p>
              </div>
            )
          })}
        </section>
      )}

      {delays.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Overdue Trips ({delays.length})
          </h2>
          {delays.map((a) => {
            if (a.type !== "delay") return null
            return (
              <div key={a.tripId} className="border border-amber-400/30 bg-amber-400/5 rounded-xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{a.loadName ?? "Trip"}</span>
                  <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
                    {a.hoursOverdue}h overdue
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{a.origin} → {a.destination}</p>
                {a.driverName && <p className="text-sm text-muted-foreground">Driver: {a.driverName}</p>}
                {a.truckName && <p className="text-sm text-muted-foreground">Truck: {a.truckName}</p>}
                <p className="text-xs text-muted-foreground">
                  Scheduled: {new Date(a.scheduledAt).toLocaleString()}
                </p>
              </div>
            )
          })}
        </section>
      )}

      {/* Client component handles auto-refresh */}
      <AlertsClient />
    </div>
  )
}
