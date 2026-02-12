'use client'

import { useState, useEffect, useCallback } from 'react'

function getCssVar(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || '#888888'
}

function readChartColors() {
  return {
    primary: getCssVar('--primary'),
    accent: getCssVar('--accent'),
    textPrimary: getCssVar('--text-primary'),
    textMuted: getCssVar('--text-muted'),
    surface: getCssVar('--surface'),
    surface2: getCssVar('--surface-2'),
    border: getCssVar('--border-color'),
    statusTodo: getCssVar('--status-todo'),
    statusInProgress: getCssVar('--status-in-progress'),
    statusWaiting: getCssVar('--status-waiting'),
    statusOnHold: getCssVar('--status-on-hold'),
    statusDone: getCssVar('--status-done'),
    priorityLow: getCssVar('--priority-low'),
    priorityMedium: getCssVar('--priority-medium'),
    priorityHigh: getCssVar('--priority-high'),
    priorityUrgent: getCssVar('--priority-urgent'),
  }
}

export function useChartColors() {
  const [colors, setColors] = useState<Record<string, string>>(() => {
    if (typeof document === 'undefined') return {}
    return readChartColors()
  })

  const syncColors = useCallback(() => {
    setColors(readChartColors())
  }, [])

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'style') {
          syncColors()
          break
        }
      }
    })

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [syncColors])

  return colors
}
