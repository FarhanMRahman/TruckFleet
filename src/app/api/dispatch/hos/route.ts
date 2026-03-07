import { NextResponse } from "next/server"
import { eq, gte } from "drizzle-orm"
import { db } from "@/lib/db"
import { drivers, hosLogs, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { createDedupedNotifications, getDispatcherUserIds } from "@/lib/notifications"

const MAX_DRIVING_HOURS = 11
const MAX_ONDUTY_HOURS = 14
const WARN_DRIVING_HOURS = 10
const WARN_ONDUTY_HOURS = 13

export async function GET() {
  try {
    await requireRole(["dispatcher", "admin"])

    const since = new Date()
    since.setDate(since.getDate() - 7)
    const now = new Date()

    const allDrivers = await db
      .select({
        id: drivers.id,
        status: drivers.status,
        licenseNumber: drivers.licenseNumber,
        userName: user.name,
        userEmail: user.email,
      })
      .from(drivers)
      .leftJoin(user, eq(drivers.userId, user.id))

    const allLogs = await db
      .select()
      .from(hosLogs)
      .where(gte(hosLogs.createdAt, since))

    const result = allDrivers.map((driver) => {
      const logs = allLogs.filter((l) => l.driverId === driver.id)

      const weeklyDrivingMinutes = logs
        .filter((l) => l.type === "driving")
        .reduce((sum, l) => sum + l.drivingMinutes, 0)

      const weeklyOnDutyMinutes = logs
        .filter((l) => l.type === "shift" && l.shiftEnd !== null)
        .reduce((sum, l) => {
          const start = l.shiftStart ? new Date(l.shiftStart).getTime() : 0
          const end = l.shiftEnd ? new Date(l.shiftEnd).getTime() : now.getTime()
          return sum + Math.round((end - start) / 60000)
        }, 0)

      const openShift = logs.find((l) => l.type === "shift" && l.shiftEnd === null)
      const currentShiftMinutes = openShift?.shiftStart
        ? Math.round((now.getTime() - new Date(openShift.shiftStart).getTime()) / 60000)
        : 0

      const drivingHours = +(weeklyDrivingMinutes / 60).toFixed(1)
      const onDutyHours = +((weeklyOnDutyMinutes + currentShiftMinutes) / 60).toFixed(1)

      const flags: string[] = []
      if (drivingHours >= MAX_DRIVING_HOURS) flags.push("Driving limit exceeded")
      else if (drivingHours >= WARN_DRIVING_HOURS) flags.push("Approaching driving limit")
      if (onDutyHours >= MAX_ONDUTY_HOURS) flags.push("On-duty limit exceeded")
      else if (onDutyHours >= WARN_ONDUTY_HOURS) flags.push("Approaching on-duty limit")

      return {
        driverId: driver.id,
        driverName: driver.userName ?? "Unknown",
        driverEmail: driver.userEmail ?? "",
        driverStatus: driver.status,
        licenseNumber: driver.licenseNumber,
        drivingHours,
        onDutyHours,
        isOnShift: !!openShift,
        flags,
      }
    })

    // Create deduped HOS warning notifications for dispatchers/admins
    const flagged = result.filter((d) => d.flags.length > 0)
    if (flagged.length > 0) {
      const dispatcherIds = await getDispatcherUserIds()
      await Promise.all(
        flagged.map((d) =>
          createDedupedNotifications({
            userIds: dispatcherIds,
            type: "hos_warning",
            message: `HOS warning for ${d.driverName}: ${d.flags.join(", ")}`,
            tripId: d.driverId,
            dedupWindowHours: 4,
          })
        )
      )
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
