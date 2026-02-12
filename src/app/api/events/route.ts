import { subscribe } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          cleanup()
        }
      }, 30_000)

      const unsubscribe = subscribe((entity) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ entity })}\n\n`))
        } catch {
          cleanup()
        }
      })

      function cleanup() {
        clearInterval(heartbeat)
        unsubscribe()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
