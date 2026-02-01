'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Palette, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppTheme } from '@/components/providers/theme-provider'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  showMenuButton?: boolean
}

function ThemeSwitcher() {
  const { theme, setTheme, themes } = useAppTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="w-9 h-9 rounded-lg animate-pulse"
        style={{ backgroundColor: 'var(--surface)' }}
      />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 group"
          style={{
            backgroundColor: 'var(--surface)',
            borderWidth: '1px',
            borderColor: 'var(--border-color)',
          }}
          aria-label="Switch theme"
        >
          {/* Color preview dots */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.colors.primary }}
            />
          </div>
          <Palette
            className="w-4 h-4 transition-opacity duration-200 group-hover:opacity-0"
            style={{ color: 'var(--text-primary)' }}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div
          className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Choose Theme
        </div>
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center gap-3 cursor-pointer py-2.5 px-2"
          >
            {/* Color preview */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-md overflow-hidden shrink-0"
              style={{
                backgroundColor: t.colors.surface,
                borderWidth: '1px',
                borderColor: t.colors.border,
              }}
            >
              <div className="flex gap-0.5">
                <div
                  className="w-2 h-4 rounded-sm"
                  style={{ backgroundColor: t.colors.primary }}
                />
                <div
                  className="w-2 h-4 rounded-sm"
                  style={{ backgroundColor: t.colors.accent }}
                />
              </div>
            </div>

            {/* Theme info */}
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {t.name}
              </div>
              <div
                className="text-xs truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.description}
              </div>
            </div>

            {/* Selected indicator */}
            <AnimatePresence>
              {theme.id === t.id && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check
                    className="w-4 h-4 shrink-0"
                    style={{ color: 'var(--primary)' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header({ title, onMenuClick, showMenuButton }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b backdrop-blur-lg px-6"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--background) 80%, transparent)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeSwitcher />
      </div>
    </header>
  )
}
