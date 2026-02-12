// Simple in-memory event emitter for SSE notifications.
// When any API mutation occurs, we emit an event so connected clients
// can invalidate their React Query cache instead of polling.

type Listener = (entity: string) => void

const listeners = new Set<Listener>()

export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function emit(entity: string) {
  for (const listener of listeners) {
    listener(entity)
  }
}
