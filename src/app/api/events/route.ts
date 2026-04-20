import { subscribe } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  let cleanup = () => {}

  const stream = new ReadableStream({
    start(controller) {
      let isCleanedUp = false

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          cleanup()
        }
      }, 30_000)

      const unsubscribe = subscribe((entity, payload) => {
        try {
          const data = payload ? { entity, payload } : { entity }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          )
        } catch {
          cleanup()
        }
      })

      const abortListener = () => {
        cleanup()
      }

      cleanup = () => {
        if (isCleanedUp) {
          return
        }

        isCleanedUp = true
        clearInterval(heartbeat)
        unsubscribe()
        request.signal.removeEventListener('abort', abortListener)
      }

      request.signal.addEventListener('abort', abortListener, { once: true })

      if (request.signal.aborted) {
        cleanup()
      }
    },
    cancel() {
      cleanup()
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
