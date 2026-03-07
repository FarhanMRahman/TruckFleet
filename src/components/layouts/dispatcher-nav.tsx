"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MapPin, Truck, Bell, Map } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dispatch", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dispatch/trips", label: "Trips", icon: MapPin },
  { href: "/dispatch/fleet", label: "Fleet Status", icon: Truck },
  { href: "/dispatch/map", label: "Live Map", icon: Map },
  { href: "/dispatch/alerts", label: "Alerts", icon: Bell },
]

export function DispatcherNav() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 border-r min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-3 py-4 flex-1">
        <p className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Dispatch
        </p>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dispatch" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
