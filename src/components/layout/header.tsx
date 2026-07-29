'use client'

import * as React from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  showMenuButton?: boolean
  actions?: React.ReactNode
}

export function Header({
  title,
  onMenuClick,
  showMenuButton,
  actions,
}: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b px-3 backdrop-blur-lg sm:px-6"
      style={{
        backgroundColor:
          'color-mix(in srgb, var(--background) 80%, transparent)',
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
        <h1
          className="text-xl font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">{actions}</div>
    </header>
  )
}
