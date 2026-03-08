"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { MessageSquare, ChevronRight } from "lucide-react"

type ThreadRow = {
  tripId: string
  tripStatus: string
  origin: string
  destination: string
  loadName: string | null
  lastMessage: string
  lastMessageAt: string
  lastMessageSender: string
  messageCount: number
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

export default function DriverMessagesPage() {
  const [threads, setThreads] = useState<ThreadRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/driver/messages")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setThreads(data) })
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Conversations from your trips.</p>
      </div>

      {loading ? (
        <div className="pt-16 text-center text-muted-foreground text-sm">Loading...</div>
      ) : threads.length === 0 ? (
        <div className="border rounded-xl p-12 text-center text-muted-foreground space-y-2">
          <MessageSquare className="h-8 w-8 mx-auto opacity-30" />
          <p className="text-sm">No messages yet.</p>
          <p className="text-xs">Messages from your trips will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <Link
              key={t.tripId}
              href={`/driver/trips/${t.tripId}`}
              className="flex items-center gap-3 border rounded-xl p-4 hover:bg-muted/40 active:bg-muted/60 transition-colors"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="font-medium text-sm truncate">{t.loadName ?? "Unknown load"}</p>
                <p className="text-xs text-muted-foreground truncate">{t.origin} → {t.destination}</p>
                <p className="text-xs text-muted-foreground truncate">
                  <span className="font-medium">{t.lastMessageSender}:</span> {t.lastMessage}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">{timeAgo(t.lastMessageAt)}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
