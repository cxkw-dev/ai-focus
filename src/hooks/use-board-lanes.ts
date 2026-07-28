'use client'

import * as React from 'react'
import {
  TERMINAL_BOARD_COLUMNS,
  type BoardColumnKey,
} from '@/lib/board-columns'

const STORAGE_KEY = 'board-expanded-lanes'
const LANE_EVENT = 'ai-focus-board-lanes'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(LANE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(LANE_EVENT, callback)
  }
}

/** A comma-joined list of open lanes — a string keeps the snapshot stable. */
function getSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function getServerSnapshot(): string {
  return ''
}

export type ExpandedLanes = Partial<Record<BoardColumnKey, boolean>>

/**
 * Whether the finished lanes (Done, Cancelled) show as full lanes or collapsed
 * rails. Finished work only grows, so the rail is the default and opening one
 * is a deliberate act — one that also decides whether the completed todos get
 * fetched at all.
 *
 * The choice is a preference, not per-board: if you like Done open, you like it
 * open everywhere. Mirrors the sidebar's collapse persistence.
 */
export function useTerminalLaneExpansion() {
  const raw = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  const expandedLanes = React.useMemo<ExpandedLanes>(() => {
    const open = new Set(raw.split(',').filter(Boolean))
    return Object.fromEntries(
      TERMINAL_BOARD_COLUMNS.map((column) => [
        column.key,
        open.has(column.key),
      ]),
    )
  }, [raw])

  const setLaneExpanded = React.useCallback(
    (key: BoardColumnKey, next: boolean) => {
      const open = new Set(getSnapshot().split(',').filter(Boolean))
      if (next) {
        open.add(key)
      } else {
        open.delete(key)
      }

      try {
        localStorage.setItem(STORAGE_KEY, [...open].join(','))
      } catch {
        // Private mode or a full quota. Nothing to recover — the rail just
        // stays where it was rather than throwing out of a click handler.
      }
      window.dispatchEvent(new Event(LANE_EVENT))
    },
    [],
  )

  // Both finished lanes are served by the same lazy fetch, so one open lane is
  // enough to pay for it.
  const anyExpanded = TERMINAL_BOARD_COLUMNS.some(
    (column) => expandedLanes[column.key],
  )

  return { expandedLanes, setLaneExpanded, anyExpanded }
}
