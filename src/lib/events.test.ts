import { describe, expect, it, vi } from 'vitest'
import { emit, subscribe } from '@/lib/events'

describe('events', () => {
  it('notifies subscribed listeners', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)
    emit('todos', { id: 1 })
    expect(listener).toHaveBeenCalledWith('todos', { id: 1 })
    unsubscribe()
  })

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)
    unsubscribe()
    emit('labels')
    expect(listener).not.toHaveBeenCalled()
  })

  it('fans out to multiple listeners', () => {
    const a = vi.fn()
    const b = vi.fn()
    const unsubA = subscribe(a)
    const unsubB = subscribe(b)
    emit('notebook')
    expect(a).toHaveBeenCalledWith('notebook', undefined)
    expect(b).toHaveBeenCalledWith('notebook', undefined)
    unsubA()
    unsubB()
  })
})
