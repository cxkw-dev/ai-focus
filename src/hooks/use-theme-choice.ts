'use client'

import { useSyncExternalStore } from 'react'
import { setTheme } from 'dawn-and-dusk/react'

/** dawn (light), dusk (dark), or follow the OS. */
export type ThemeChoice = 'dawn' | 'dusk' | 'system'

const STORAGE_KEY = 'dd-theme'

function readChoice(): ThemeChoice {
  const theme = document.documentElement.dataset.theme
  return theme === 'dawn' || theme === 'dusk' ? theme : 'system'
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  // Another tab changed the theme: apply it here too.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    const next = event.newValue
    setTheme(next === 'dawn' || next === 'dusk' ? next : 'system')
  }
  window.addEventListener('storage', onStorage)
  return () => {
    observer.disconnect()
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * The saved dawn & dusk theme choice. ThemeScript (app/layout.tsx) restores it onto <html data-theme> before
 * hydration; setTheme from the system's React layer saves it and swaps in one frame.
 */
export function useThemeChoice() {
  const choice = useSyncExternalStore(subscribe, readChoice, () => 'system')
  return [choice as ThemeChoice, setTheme] as const
}
