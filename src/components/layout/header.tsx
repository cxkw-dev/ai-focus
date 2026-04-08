'use client'

import * as React from 'react'
import { Menu, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScratchPadDrawer } from '@/components/todos/scratch-pad-drawer'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  showMenuButton?: boolean
  actions?: React.ReactNode
}

function ScratchPadButton() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-md transition-colors"
        style={{
          color: open ? 'var(--primary)' : 'var(--text-muted)',
          backgroundColor: open
            ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
            : 'transparent',
        }}
        title="Scratch pad"
        aria-label="Open scratch pad"
      >
        <PenLine className="h-4 w-4" />
      </button>
      <ScratchPadDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
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

      <div className="flex items-center gap-2">
        {actions}
        <ScratchPadButton />
      </div>
    </header>
  )
}
