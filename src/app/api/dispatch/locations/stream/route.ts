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
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (data: unknown) => `data: ${JSON.stringify(data)}\n\n`

      const send = async () => {
        if (closed) return
        try {
          const locations = await fetchLatestLocations()
          if (closed) return
          controller.enqueue(encode(locations))
        } catch {
          // ignore transient errors
        }
      }

      await send()
      interval = setInterval(() => { void send() }, POLL_INTERVAL_MS)
    },
    cancel() {
      closed = true
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
