import { NextResponse } from "next/server"
import { eq, desc, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { trips, drivers, chemicalLoads, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"

export async function GET() {
  try {
    await requireRole(["admin", "dispatcher"])

    // All trips that have at least one message, with last message metadata
    const rows = await db
      .select({
        tripId: trips.id,
        tripStatus: trips.status,
        origin: trips.origin,
        destination: trips.destination,
        loadName: chemicalLoads.name,
        driverName: user.name,
        lastMessage: sql<string>`(
          SELECT content FROM messages
          WHERE trip_id = ${trips.id}
          ORDER BY created_at DESC
          LIMIT 1
        )`.as("last_message"),
        lastMessageAt: sql<string>`(
          SELECT created_at FROM messages
          WHERE trip_id = ${trips.id}
          ORDER BY created_at DESC
          LIMIT 1
        )`.as("last_message_at"),
        lastMessageSender: sql<string>`(
          SELECT sender_name FROM messages
          WHERE trip_id = ${trips.id}
          ORDER BY created_at DESC
          LIMIT 1
        )`.as("last_message_sender"),
        messageCount: sql<number>`(
          SELECT COUNT(*) FROM messages WHERE trip_id = ${trips.id}
        )`.as("message_count"),
      })
      .from(trips)
      .leftJoin(chemicalLoads, eq(trips.loadId, chemicalLoads.id))
      .leftJoin(drivers, eq(trips.driverId, drivers.id))
      .leftJoin(user, eq(drivers.userId, user.id))
      .orderBy(desc(sql`last_message_at`))

    const withMessages = rows.filter((r) => r.lastMessage)

    return NextResponse.json(withMessages)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
