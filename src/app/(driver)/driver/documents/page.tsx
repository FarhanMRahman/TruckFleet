"use client"

import { useEffect, useState } from "react"
import { FileText, ExternalLink, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type DocRow = {
  tripId: string
  origin: string
  destination: string
  status: string
  scheduledAt: string | null
  loadId: string
  loadName: string
  hazardClass: string
  unNumber: string | null
  sdsDocumentUrl: string | null
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  assigned: "Assigned",
  in_progress: "In Progress",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  assigned: "default",
  in_progress: "default",
  delivered: "outline",
  cancelled: "destructive",
}

export default function DriverDocumentsPage() {
  const [rows, setRows] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/driver/documents")
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No documents yet.</p>
        <p className="text-xs text-muted-foreground">
          SDS sheets and shipping manifests will appear here once trips are assigned.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 space-y-3">
      <h1 className="text-lg font-semibold">Documents</h1>
      <p className="text-xs text-muted-foreground -mt-2">
        Safety Data Sheets for your assigned loads
      </p>

      {rows.map((row) => (
        <div
          key={`${row.tripId}-${row.loadId}`}
          className="rounded-xl border bg-card p-4 space-y-3"
        >
          {/* Load header */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="font-medium text-sm leading-tight truncate">{row.loadName}</p>
              <p className="text-xs text-muted-foreground">
                {row.origin} → {row.destination}
              </p>
            </div>
            <Badge variant={STATUS_VARIANTS[row.status] ?? "secondary"} className="shrink-0 text-xs">
              {STATUS_LABELS[row.status] ?? row.status}
            </Badge>
          </div>

          {/* Hazard info */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Class {row.hazardClass}</span>
            </div>
            {row.unNumber && (
              <div className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
                {row.unNumber}
              </div>
            )}
          </div>

          {/* SDS document link */}
          {row.sdsDocumentUrl ? (
            <a
              href={row.sdsDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="flex-1 font-medium">View SDS / Safety Data Sheet</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </a>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 shrink-0" />
              <span>SDS not yet uploaded by admin</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
