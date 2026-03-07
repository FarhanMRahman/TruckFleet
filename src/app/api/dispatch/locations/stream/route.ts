import { fetchLatestLocations } from "@/app/api/dispatch/locations/route"
import { requireRole } from "@/lib/session"

const POLL_INTERVAL_MS = 10_000

export async function GET() {
  try {
    await requireRole(["admin", "dispatcher"])
  } catch {
    return new Response("Unauthorized", { status: 401 })
  }

  let interval: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (data: unknown) => `data: ${JSON.stringify(data)}\n\n`

      const send = async () => {
        try {
          const locations = await fetchLatestLocations()
          controller.enqueue(encode(locations))
        } catch {
          // ignore — cancel() will clean up the interval
        }
      }

      await send()
      interval = setInterval(() => { void send() }, POLL_INTERVAL_MS)
    },
    cancel() {
      clearInterval(interval)
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
