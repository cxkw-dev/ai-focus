'use client'

import * as React from 'react'

const DONE_LANE_KEY = 'board-done-expanded'
const DONE_LANE_EVENT = 'ai-focus-done-lane'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(DONE_LANE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(DONE_LANE_EVENT, callback)
  }
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(DONE_LANE_KEY) === 'true'
  } catch {
    return false
  }
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * Whether boards show Done as a full lane or a collapsed rail. Finished work
 * only grows, so the rail is the default and opening it is a deliberate act —
 * one that also decides whether the completed todos get fetched at all.
 *
 * The choice is a preference, not per-board: if you like Done open, you like it
 * open everywhere. Mirrors the sidebar's collapse persistence.
 */
export function useDoneLaneExpanded() {
  const expanded = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  const setExpanded = React.useCallback((next: boolean) => {
    try {
      localStorage.setItem(DONE_LANE_KEY, String(next))
    } catch {
      // Private mode or a full quota. Nothing to recover — the rail just stays
      // where it was rather than throwing out of a click handler.
    }
    window.dispatchEvent(new Event(DONE_LANE_EVENT))
  }, [])

  return [expanded, setExpanded] as const
}
