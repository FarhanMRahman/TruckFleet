import { db } from "@/lib/db"
import { truckLocations, trucks, drivers, trips, chemicalLoads, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { eq, desc, and, inArray, sql } from "drizzle-orm"

const POLL_INTERVAL_MS = 10_000

async function fetchLocations() {
  const latestIds = db
    .select({
      id: sql<string>`DISTINCT ON (${truckLocations.truckId}) ${truckLocations.id}`,
    })
    .from(truckLocations)
    .orderBy(truckLocations.truckId, desc(truckLocations.recordedAt))
    .as("latest_ids")

  return db
    .select({
      locationId: truckLocations.id,
      lat: truckLocations.lat,
      lng: truckLocations.lng,
      heading: truckLocations.heading,
      speed: truckLocations.speed,
      recordedAt: truckLocations.recordedAt,
      truckId: trucks.id,
      truckName: trucks.name,
      truckPlate: trucks.plate,
      truckType: trucks.type,
      truckStatus: trucks.status,
      driverName: user.name,
      tripStatus: trips.status,
      loadName: chemicalLoads.name,
      loadHazardClass: chemicalLoads.hazardClass,
    })
    .from(truckLocations)
    .innerJoin(latestIds, eq(truckLocations.id, latestIds.id))
    .innerJoin(trucks, eq(truckLocations.truckId, trucks.id))
    .leftJoin(drivers, eq(truckLocations.driverId, drivers.id))
    .leftJoin(user, eq(drivers.userId, user.id))
    .leftJoin(
      trips,
      and(
        eq(trips.truckId, trucks.id),
        inArray(trips.status, ["assigned", "in_progress"])
      )
    )
    .leftJoin(chemicalLoads, eq(trips.loadId, chemicalLoads.id))
}

export async function GET() {
  try {
    await requireRole(["admin", "dispatcher"])
  } catch {
    return new Response("Unauthorized", { status: 401 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (data: unknown) =>
        `data: ${JSON.stringify(data)}\n\n`

      const send = async () => {
        try {
          const locations = await fetchLocations()
          controller.enqueue(encode(locations))
        } catch {
          controller.close()
        }
      }

      // Send immediately, then poll
      await send()
      const interval = setInterval(send, POLL_INTERVAL_MS)

      // Clean up when client disconnects
      const cleanup = () => clearInterval(interval)
      controller.desiredSize // touch to register close
      // Store cleanup on the stream (closed via abort signal below)
      return cleanup
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
