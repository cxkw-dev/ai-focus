'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'
import { themes, defaultTheme, getThemeById, applyTheme, type Theme } from '@/lib/themes'

const THEME_STORAGE_KEY = 'ai-focus-theme'

interface AppThemeContextType {
  theme: Theme
  setTheme: (themeId: string) => void
  themes: Theme[]
}

const AppThemeContext = React.createContext<AppThemeContextType | undefined>(undefined)

export function useAppTheme() {
  const context = React.useContext(AppThemeContext)
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider')
  }
  return context
}

function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [mounted, setMounted] = React.useState(false)

  // Load saved theme on mount
  React.useEffect(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedThemeId) {
      const savedTheme = getThemeById(savedThemeId)
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    }
    setMounted(true)
  }, [])

  // Apply theme when it changes
  React.useEffect(() => {
    if (mounted) {
      applyTheme(theme)
    }
  }, [theme, mounted])

  const setTheme = React.useCallback((themeId: string) => {
    const newTheme = getThemeById(themeId)
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
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
      <AppThemeProvider>
        {children}
      </AppThemeProvider>
    </NextThemesProvider>
  )
}
