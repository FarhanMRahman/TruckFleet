"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MapPin, MessageSquare, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/driver", label: "Home", icon: Home },
  { href: "/driver/trips", label: "My Trips", icon: MapPin },
  { href: "/driver/messages", label: "Messages", icon: MessageSquare },
  { href: "/driver/documents", label: "Documents", icon: FileText },
]

export function DriverBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/driver" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-md text-xs font-medium transition-colors min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
