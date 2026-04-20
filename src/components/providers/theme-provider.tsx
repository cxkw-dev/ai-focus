'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import {
  themes,
  defaultTheme,
  getThemeById,
  applyTheme,
  type Theme,
} from '@/lib/themes'
import { useIsClient } from '@/hooks/use-is-client'

const THEME_STORAGE_KEY = 'ai-focus-theme'
const THEME_EVENT = 'ai-focus-theme-change'

interface AppThemeContextType {
  theme: Theme
  setTheme: (themeId: string) => void
  themes: Theme[]
}

const AppThemeContext = React.createContext<AppThemeContextType | undefined>(
  undefined,
)

export function useAppTheme() {
  const context = React.useContext(AppThemeContext)
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider')
  }
  return context
}

function subscribeTheme(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(THEME_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(THEME_EVENT, callback)
  }
}

function getThemeIdSnapshot() {
  return localStorage.getItem(THEME_STORAGE_KEY) ?? defaultTheme.id
}

function getServerThemeIdSnapshot() {
  return defaultTheme.id
}

function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = React.useSyncExternalStore(
    subscribeTheme,
    getThemeIdSnapshot,
    getServerThemeIdSnapshot,
  )
  const theme = getThemeById(themeId)
  const mounted = useIsClient()

  React.useEffect(() => {
    if (mounted) {
      applyTheme(theme)
    }
  }, [theme, mounted])

  const setTheme = React.useCallback((nextThemeId: string) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextThemeId)
    window.dispatchEvent(new Event(THEME_EVENT))
  }, [])

  return (
    <AppThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </AppThemeContext.Provider>
  )
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <AppThemeProvider>{children}</AppThemeProvider>
    </NextThemesProvider>
  )
}
