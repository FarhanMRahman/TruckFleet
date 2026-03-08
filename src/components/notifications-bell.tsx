"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Notification = {
  id: string
  type: string
  message: string
  tripId: string | null
  read: boolean
  createdAt: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function getLink(n: Notification): string | null {
  const isDriver = typeof window !== "undefined" && window.location.pathname.startsWith("/driver")
  if (n.type === "trip_assigned" || n.type === "trip_updated" || n.type === "trip_cancelled") {
    if (!n.tripId) return null
    return isDriver ? `/driver/trips/${n.tripId}` : `/dispatch/trips/${n.tripId}`
  }
  if (n.type === "delay_alert") return n.tripId ? `/dispatch/trips/${n.tripId}` : "/dispatch/alerts"
  if (n.type === "offline_alert") return "/dispatch/alerts"
  if (n.type === "hos_warning") return "/dispatch/hos"
  return null
}

export function NotificationsBell() {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) setItems(await res.json())
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNotifications()
    const interval = setInterval(() => { void fetchNotifications() }, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  function handleClick(n: Notification) {
    if (!n.read) {
      fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {})
      setItems((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item))
    }
    const link = getLink(n)
    if (link) router.push(link)
  }

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) fetchNotifications()
  }

  const unreadCount = items.filter((n) => !n.read).length

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">{unreadCount} unread</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          items.slice(0, 10).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-1 p-3 cursor-pointer whitespace-normal ${!n.read ? "bg-muted/50" : ""}`}
              onClick={() => handleClick(n)}
            >
              <div className="flex items-start justify-between w-full gap-2">
                <p className={`text-sm leading-snug ${!n.read ? "font-medium" : "text-muted-foreground"}`}>
                  {n.message}
                </p>
                {!n.read && (
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
