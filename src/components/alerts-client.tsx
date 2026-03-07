"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Refreshes the server-rendered alerts page every 60 seconds
export function AlertsClient() {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 60_000)
    return () => clearInterval(interval)
  }, [router])

  return null
}
