import { and, eq, gte, inArray, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { notifications, user } from "@/lib/schema"

/** Get user IDs for all admins and dispatchers */
export async function getDispatcherUserIds(): Promise<string[]> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(inArray(user.role, ["admin", "dispatcher"]))
  return rows.map((r) => r.id)
}

type CreateNotificationOpts = {
  userIds: string[]
  type: string
  message: string
  tripId?: string | null
  dedupWindowHours?: number
}

/**
 * Insert notifications for a list of users, skipping any user who already has
 * a notification of the same type+tripId within the dedup window.
 */
export async function createDedupedNotifications({
  userIds,
  type,
  message,
  tripId = null,
  dedupWindowHours = 2,
}: CreateNotificationOpts) {
  if (userIds.length === 0) return

  const since = new Date(Date.now() - dedupWindowHours * 60 * 60 * 1000)

  const existing = await db
    .select({ userId: notifications.userId })
    .from(notifications)
    .where(
      and(
        inArray(notifications.userId, userIds),
        eq(notifications.type, type),
        tripId ? eq(notifications.tripId, tripId) : isNull(notifications.tripId),
        gte(notifications.createdAt, since)
      )
    )

  const alreadyNotified = new Set(existing.map((r) => r.userId))
  const toNotify = userIds.filter((id) => !alreadyNotified.has(id))

  if (toNotify.length === 0) return

  await db.insert(notifications).values(
    toNotify.map((userId) => ({ userId, type, message, tripId }))
  )
}
