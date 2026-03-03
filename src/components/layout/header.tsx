'use client'

import * as React from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useOllamaStatus } from '@/hooks/use-ollama-status'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  showMenuButton?: boolean
  actions?: React.ReactNode
}

function OllamaStatus() {
  const { data, isLoading } = useOllamaStatus()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) return null

  const connected = data?.connected ?? false
  const model = data?.model ?? ''
  const url = data?.url ?? ''

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium cursor-default select-none transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
            }}
          >
            <span
              className="relative flex h-2 w-2"
            >
              {connected && (
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: '#22c55e' }}
                />
              )}
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: connected ? '#22c55e' : '#ef4444' }}
              />
            </span>
            <span className="hidden sm:inline">{model || 'ollama'}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs">
            <p className="font-medium">{connected ? 'Ollama connected' : 'Ollama unreachable'}</p>
            <p style={{ color: 'var(--text-muted)' }}>{url}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function Header({ title, onMenuClick, showMenuButton, actions }: HeaderProps) {
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
        {actions}
        <OllamaStatus />
      </div>
    </header>
  )
}
