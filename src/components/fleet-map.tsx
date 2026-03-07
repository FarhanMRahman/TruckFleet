"use client"

import { useEffect, useRef, useState } from "react"
import type { Map as LeafletMap, Marker } from "leaflet"
import type * as L from "leaflet"

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

function applyMarkers(
  Leaflet: typeof L,
  map: LeafletMap,
  markers: Map<string, Marker>,
  locs: TruckLocation[]
) {
  const seen = new Set<string>()

  for (const loc of locs) {
    seen.add(loc.truckId)
    const color = STATUS_COLOR[loc.tripStatus ?? loc.truckStatus ?? ""] ?? "#6b7280"

    const icon = Leaflet.divIcon({
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

    if (markers.has(loc.truckId)) {
      const marker = markers.get(loc.truckId)!
      marker.setLatLng([loc.lat, loc.lng])
      marker.setIcon(icon)
      marker.setPopupContent(popupHtml(loc))
    } else {
      const marker = Leaflet.marker([loc.lat, loc.lng], { icon })
        .addTo(map)
        .bindPopup(popupHtml(loc))
      markers.set(loc.truckId, marker)
    }
  }

  for (const [truckId, marker] of markers) {
    if (!seen.has(truckId)) {
      marker.remove()
      markers.delete(truckId)
    }
  }

  if (locs.length > 0 && markers.size > 0) {
    const group = Leaflet.featureGroup([...markers.values()])
    map.fitBounds(group.getBounds().pad(0.2))
  }
}

interface Props {
  initialLocations: TruckLocation[]
}

export function FleetMap({ initialLocations }: Props) {
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const locationsRef = useRef<TruckLocation[]>(initialLocations)
  const [locations, setLocations] = useState<TruckLocation[]>(initialLocations)

  // Keep locationsRef in sync so map init can read the latest value
  locationsRef.current = locations

  // Initialise Leaflet map, then immediately apply current locations
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    import("leaflet").then((Leaflet) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      delete (Leaflet.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      let map: LeafletMap
      try {
        map = Leaflet.map(containerRef.current).setView([39.8283, -98.5795], 4)
      } catch {
        return
      }

      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      mapRef.current = map

      // Apply whatever locations are available right now
      applyMarkers(Leaflet, map, markersRef.current, locationsRef.current)
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current.clear()
      if (containerRef.current) {
        delete (containerRef.current as unknown as Record<string, unknown>)._leaflet_id
      }
    }
  }, [])

  // Update markers when SSE pushes new locations
  useEffect(() => {
    if (!mapRef.current) return
    import("leaflet").then((Leaflet) => {
      if (!mapRef.current) return
      applyMarkers(Leaflet, mapRef.current, markersRef.current, locations)
    })
  }, [locations])

  // SSE subscription for live updates
  useEffect(() => {
    const es = new EventSource("/api/dispatch/locations/stream")
    es.onmessage = (e) => {
      try {
        setLocations(JSON.parse(e.data) as TruckLocation[])
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
