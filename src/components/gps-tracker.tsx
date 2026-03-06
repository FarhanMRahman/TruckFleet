"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, WifiOff } from "lucide-react"

const INTERVAL_MS = 30_000 // send location every 30 seconds

interface Props {
  active: boolean // only track when driver has an active trip
}

export function GpsTracker({ active }: Props) {
  const [status, setStatus] = useState<"idle" | "tracking" | "denied" | "error">("idle")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function sendLocation() {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await fetch("/api/driver/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              heading: pos.coords.heading,
              speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : null, // m/s → km/h
            }),
          })
          setStatus("tracking")
        } catch {
          setStatus("error")
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus("denied")
        else setStatus("error")
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    void sendLocation()
    intervalRef.current = setInterval(() => { void sendLocation() }, INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [active])

  if (!active) return null

  return (
    <div className="fixed bottom-20 right-3 z-50">
      {status === "tracking" && (
        <div className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-medium px-2.5 py-1.5 rounded-full shadow-md">
          <MapPin className="h-3 w-3" />
          Sharing location
        </div>
      )}
      {(status === "denied" || status === "error") && (
        <div className="flex items-center gap-1.5 bg-destructive text-destructive-foreground text-xs font-medium px-2.5 py-1.5 rounded-full shadow-md">
          <WifiOff className="h-3 w-3" />
          {status === "denied" ? "Location denied" : "GPS error"}
        </div>
      )}
    </div>
  )
}
