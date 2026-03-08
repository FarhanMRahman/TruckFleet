"use client"

import { useEffect, useState } from "react"
import { FileText, ExternalLink, AlertTriangle, FlaskConical } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Load = {
  id: string
  name: string
  hazardClass: string
  unNumber: string | null
  requiredVehicleType: string
  requiredCertifications: string[]
  handlingNotes: string | null
  sdsDocumentUrl: string | null
}

const VEHICLE_LABELS: Record<string, string> = {
  tanker: "Tanker",
  hazmat: "HazMat Truck",
  flatbed: "Flatbed",
  refrigerated: "Refrigerated",
}

export default function DispatchDocumentsPage() {
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/chemical-loads")
      .then((r) => r.json())
      .then((data) => setLoads(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  const withDocs = loads.filter((l) => l.sdsDocumentUrl)
  const withoutDocs = loads.filter((l) => !l.sdsDocumentUrl)

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground">
          SDS / Safety Data Sheets for chemical loads
        </p>
      </div>

      {loads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No chemical loads defined yet.</p>
        </div>
      ) : (
        <>
          {/* Loads with SDS */}
          {withDocs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                SDS Available ({withDocs.length})
              </h2>
              {withDocs.map((load) => (
                <LoadCard key={load.id} load={load} />
              ))}
            </section>
          )}

          {/* Loads without SDS */}
          {withoutDocs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                SDS Not Uploaded ({withoutDocs.length})
              </h2>
              {withoutDocs.map((load) => (
                <LoadCard key={load.id} load={load} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function LoadCard({ load }: { load: Load }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="font-medium text-sm truncate">{load.name}</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {VEHICLE_LABELS[load.requiredVehicleType] ?? load.requiredVehicleType}
        </Badge>
      </div>

      {/* Hazard info */}
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Class {load.hazardClass}</span>
        </div>
        {load.unNumber && (
          <div className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
            {load.unNumber}
          </div>
        )}
        {load.requiredCertifications.length > 0 && load.requiredCertifications.map((c) => (
          <div key={c} className="rounded-md bg-muted px-2 py-1 text-muted-foreground capitalize">
            {c.replace(/_/g, " ")}
          </div>
        ))}
      </div>

      {/* Handling notes */}
      {load.handlingNotes && (
        <p className="text-xs text-muted-foreground border-l-2 pl-3">{load.handlingNotes}</p>
      )}

      {/* SDS link */}
      {load.sdsDocumentUrl ? (
        <a
          href={load.sdsDocumentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors"
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="flex-1 font-medium">View SDS / Safety Data Sheet</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </a>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
          <FileText className="h-4 w-4 shrink-0" />
          <span>SDS not yet uploaded — contact admin</span>
        </div>
      )}
    </div>
  )
}
