// Simple in-memory event emitter for SSE notifications.
// When any API mutation occurs, we emit an event so connected clients
// can invalidate their React Query cache instead of polling.

export type EventEntity =
  | 'todos'
  | 'people'
  | 'labels'
  | 'todoContacts'
  | 'todoUpdates'
  | 'notebook'
  | 'accomplishments'
  | 'eval'

export type EventPayloadByEntity = {
  todos: { todoId?: string } | undefined
  people: undefined
  labels: undefined
  todoContacts: { todoId: string }
  todoUpdates: { todoId: string }
  notebook: undefined
  accomplishments: { year: number }
  eval: {
    stage: 'analyzing' | 'classifying' | 'result'
    todoId: string
    taskTitle: string
    outcome?: { created: boolean; title?: string; category?: string }
  }
}

export type EventPayload<E extends EventEntity> = EventPayloadByEntity[E]

type Listener = (
  entity: EventEntity,
  payload?: EventPayload<EventEntity>,
) => void

const listeners = new Set<Listener>()

export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emit<E extends EventEntity>(
  entity: E,
  payload?: EventPayload<E>,
) {
  for (const listener of listeners) {
    listener(entity, payload)
  }
}
