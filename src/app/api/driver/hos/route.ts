import { NextResponse } from "next/server"
import { and, eq, gte } from "drizzle-orm"
import { db } from "@/lib/db"
import { drivers, hosLogs } from "@/lib/schema"
import { requireRole } from "@/lib/session"

// HOS federal limits
const MAX_DRIVING_HOURS = 11
const MAX_ONDUTY_HOURS = 14
const WARN_DRIVING_HOURS = 10
const WARN_ONDUTY_HOURS = 13

export async function GET() {
  try {
    const { session } = await requireRole(["driver"])

    const [driver] = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(eq(drivers.userId, session.user.id))
      .limit(1)

    if (!driver) return NextResponse.json({ error: "No driver profile" }, { status: 404 })

    // Last 7 days
    const since = new Date()
    since.setDate(since.getDate() - 7)

    const logs = await db
      .select()
      .from(hosLogs)
      .where(and(eq(hosLogs.driverId, driver.id), gte(hosLogs.createdAt, since)))

    const now = new Date()

    // Weekly driving minutes from completed driving records
    const weeklyDrivingMinutes = logs
      .filter((l) => l.type === "driving")
      .reduce((sum, l) => sum + l.drivingMinutes, 0)

    // Weekly on-duty minutes from completed shifts
    const weeklyOnDutyMinutes = logs
      .filter((l) => l.type === "shift" && l.shiftEnd !== null)
      .reduce((sum, l) => {
        const start = l.shiftStart ? new Date(l.shiftStart).getTime() : 0
        const end = l.shiftEnd ? new Date(l.shiftEnd).getTime() : now.getTime()
        return sum + Math.round((end - start) / 60000)
      }, 0)

    // Open shift (if currently on duty)
    const openShift = logs.find((l) => l.type === "shift" && l.shiftEnd === null)
    const currentShiftMinutes = openShift?.shiftStart
      ? Math.round((now.getTime() - new Date(openShift.shiftStart).getTime()) / 60000)
      : 0

    const totalOnDutyMinutes = weeklyOnDutyMinutes + currentShiftMinutes

    const drivingHours = +(weeklyDrivingMinutes / 60).toFixed(1)
    const onDutyHours = +(totalOnDutyMinutes / 60).toFixed(1)

    return NextResponse.json({
      drivingHours,
      onDutyHours,
      weeklyDrivingHours: drivingHours,
      currentShiftMinutes,
      isOnShift: !!openShift,
      warnings: {
        approachingDrivingLimit: drivingHours >= WARN_DRIVING_HOURS && drivingHours < MAX_DRIVING_HOURS,
        exceededDrivingLimit: drivingHours >= MAX_DRIVING_HOURS,
        approachingOnDutyLimit: onDutyHours >= WARN_ONDUTY_HOURS && onDutyHours < MAX_ONDUTY_HOURS,
        exceededOnDutyLimit: onDutyHours >= MAX_ONDUTY_HOURS,
      },
    })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
