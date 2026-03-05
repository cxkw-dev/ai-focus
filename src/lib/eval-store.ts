'use client'

import { useSyncExternalStore } from 'react'
import type { AccomplishmentCategory } from '@/types/accomplishment'

export type EvalStage = 'analyzing' | 'classifying' | 'result'

export interface EvalEntry {
  todoId: string
  taskTitle: string
  stage: EvalStage
  outcome?: {
    created: boolean
    title?: string
    category?: AccomplishmentCategory
  }
}

// Module-level state — shared across all imports in the browser bundle
let entries = new Map<string, EvalEntry>()
const listeners = new Set<() => void>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function notify() {
  for (const l of listeners) l()
}

export function pushEvalEntry(payload: {
  stage: EvalStage
  todoId: string
  taskTitle: string
  outcome?: { created: boolean; title?: string; category?: string }
}) {
  entries = new Map(entries)
  const existing = entries.get(payload.todoId)
  entries.set(payload.todoId, {
    todoId: payload.todoId,
    taskTitle: payload.taskTitle,
    stage: payload.stage,
    outcome: payload.outcome as EvalEntry['outcome'],
  })
  notify()

  // Auto-remove results after 4s
  if (payload.stage === 'result') {
    const existing = timers.get(payload.todoId)
    if (existing) clearTimeout(existing)

    timers.set(
      payload.todoId,
      setTimeout(() => {
        timers.delete(payload.todoId)
        entries = new Map(entries)
        entries.delete(payload.todoId)
        notify()
      }, 4000),
    )
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

function getSnapshot() {
  return entries
}

export function useEvalEntries() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
