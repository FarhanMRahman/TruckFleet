"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Thread = {
  tripId: string
  tripStatus: string
  origin: string
  destination: string
  loadName: string | null
  driverName: string | null
  lastMessage: string
  lastMessageAt: string
  lastMessageSender: string
  messageCount: number
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  assigned: "default",
  in_progress: "default",
  delivered: "outline",
  cancelled: "destructive",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  assigned: "Assigned",
  in_progress: "In Progress",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export default function DispatchMessagesPage() {
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dispatch/messages")
      .then((r) => r.json())
      .then((data) => setThreads(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">All trip conversations</p>
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No messages yet.</p>
          <p className="text-xs text-muted-foreground">
            Conversations started on trip detail pages will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <button
              key={t.tripId}
              onClick={() => router.push(`/dispatch/trips/${t.tripId}`)}
              className="w-full text-left rounded-xl border bg-card hover:bg-muted/50 transition-colors p-4 space-y-2 cursor-pointer"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {t.origin} → {t.destination}
                  </p>
                  {t.loadName && (
                    <p className="text-xs text-muted-foreground truncate">{t.loadName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANTS[t.tripStatus] ?? "secondary"} className="text-xs">
                    {STATUS_LABELS[t.tripStatus] ?? t.tripStatus}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(t.lastMessageAt)}
                  </span>
                </div>
              </div>

              {/* Last message */}
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate">
                  <span className="font-medium text-foreground">{t.lastMessageSender}:</span>{" "}
                  {t.lastMessage}
                </p>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {t.messageCount} msg{Number(t.messageCount) !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Driver */}
              {t.driverName && (
                <p className="text-xs text-muted-foreground">Driver: {t.driverName}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
