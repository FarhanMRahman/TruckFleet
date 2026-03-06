"use client"

import { useEffect, useRef, useState } from "react"
import type { Map as LeafletMap, Marker } from "leaflet"

export type TruckLocation = {
  locationId: string
  truckId: string
  truckName: string
  truckPlate: string
  truckType: string | null
  truckStatus: string | null
  lat: number
  lng: number
  heading: number | null
  speed: number | null
  recordedAt: Date | string
  driverName: string | null
  tripStatus: string | null
  loadName: string | null
  loadHazardClass: string | null
}

const STATUS_COLOR: Record<string, string> = {
  in_progress: "#7c3aed",
  assigned: "#2563eb",
  available: "#16a34a",
  on_trip: "#7c3aed",
  maintenance: "#d97706",
  inactive: "#6b7280",
}

function minutesAgo(iso: Date | string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60_000
  if (diff < 1) return "just now"
  return `${Math.floor(diff)}m ago`
}

function popupHtml(loc: TruckLocation) {
  const color = STATUS_COLOR[loc.tripStatus ?? loc.truckStatus ?? ""] ?? "#6b7280"
  const minsAgo = minutesAgo(loc.recordedAt)
  const isStale = (Date.now() - new Date(loc.recordedAt as string).getTime()) > 10 * 60_000

  return `
    <div style="min-width:180px;font-family:sans-serif;font-size:13px">
      <div style="font-weight:700;font-size:14px;margin-bottom:4px">${loc.truckName}</div>
      <div style="color:#6b7280;font-size:11px;margin-bottom:6px">${loc.truckPlate}</div>
      ${loc.driverName ? `<div style="margin-bottom:4px">👤 ${loc.driverName}</div>` : ""}
      ${loc.loadName ? `<div style="margin-bottom:4px">📦 ${loc.loadName}${loc.loadHazardClass ? ` <span style="color:#b91c1c">(${loc.loadHazardClass})</span>` : ""}</div>` : ""}
      ${loc.speed != null ? `<div style="margin-bottom:4px">🚛 ${Math.round(loc.speed)} km/h</div>` : ""}
      <div style="margin-top:6px;display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color}"></span>
        <span style="text-transform:capitalize">${(loc.tripStatus ?? loc.truckStatus ?? "unknown").replace("_", " ")}</span>
      </div>
      <div style="margin-top:4px;color:${isStale ? "#dc2626" : "#6b7280"};font-size:11px">
        ${isStale ? "⚠ Offline · " : ""}Last ping: ${minsAgo}
      </div>
    </div>
  `
}

interface Props {
  initialLocations: TruckLocation[]
}

export function FleetMap({ initialLocations }: Props) {
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const [locations, setLocations] = useState<TruckLocation[]>(initialLocations)

  // Initialise Leaflet map (client-side only)
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(containerRef.current!).setView([39.8283, -98.5795], 4)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)
      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers whenever locations change
  useEffect(() => {
    if (!mapRef.current) return

    import("leaflet").then((L) => {
      const map = mapRef.current!
      const existing = markersRef.current
      const seen = new Set<string>()

      for (const loc of locations) {
        seen.add(loc.truckId)
        const color = STATUS_COLOR[loc.tripStatus ?? loc.truckStatus ?? ""] ?? "#6b7280"

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${color};border:3px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,.4);
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:14px;font-weight:700
          ">🚛</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -20],
        })

        if (existing.has(loc.truckId)) {
          const marker = existing.get(loc.truckId)!
          marker.setLatLng([loc.lat, loc.lng])
          marker.setIcon(icon)
          marker.setPopupContent(popupHtml(loc))
        } else {
          const marker = L.marker([loc.lat, loc.lng], { icon })
            .addTo(map)
            .bindPopup(popupHtml(loc))
          existing.set(loc.truckId, marker)
        }
      }

      // Remove markers for trucks no longer in data
      for (const [truckId, marker] of existing) {
        if (!seen.has(truckId)) {
          marker.remove()
          existing.delete(truckId)
        }
      }

      // Auto-fit map to all markers on first load
      if (locations.length > 0 && existing.size > 0) {
        const group = L.featureGroup([...existing.values()])
        map.fitBounds(group.getBounds().pad(0.2))
      }
    })
  }, [locations])

  // SSE subscription for live updates
  useEffect(() => {
    const es = new EventSource("/api/dispatch/locations/stream")
    es.onmessage = (e) => {
      try {
        setLocations(JSON.parse(e.data))
      } catch {
        // ignore parse errors
      }
    }
    return () => es.close()
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
  )
}
