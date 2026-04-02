'use client'

import * as React from 'react'
import { ChevronDown, ChevronRight, Terminal, X } from 'lucide-react'
import { SiAnthropic, SiOpenai } from 'react-icons/si'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { Session } from '@/types/todo'

const TOOL_CONFIG = {
  claude: {
    icon: SiAnthropic,
    colorVar: '#d4a574',
    bgTint: 'rgba(212,165,116,0.04)',
    borderTint: 'rgba(212,165,116,0.10)',
    buttonBg: 'rgba(212,165,116,0.10)',
    buttonBorder: 'rgba(212,165,116,0.15)',
  },
  codex: {
    icon: SiOpenai,
    colorVar: '#4ade80',
    bgTint: 'rgba(74,222,128,0.04)',
    borderTint: 'rgba(74,222,128,0.10)',
    buttonBg: 'rgba(74,222,128,0.10)',
    buttonBorder: 'rgba(74,222,128,0.15)',
  },
} as const

interface SessionListProps {
  sessions: Session[]
  onDelete?: (sessionId: string) => void
  compact?: boolean
}

export function SessionList({ sessions, onDelete, compact = false }: SessionListProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  if (sessions.length === 0) return null

  const grouped = React.useMemo(() => {
    const groups: Record<string, Session[]> = {}
    for (const session of sessions) {
      if (!groups[session.tool]) groups[session.tool] = []
      groups[session.tool].push(session)
    }
    return groups
  }, [sessions])

  const handleCopy = React.useCallback(async (session: Session) => {
    await navigator.clipboard.writeText(session.command)
    setCopiedId(session.id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  return (
    <div
      className={cn(!compact && 'pt-1.5')}
      style={!compact ? { borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)' } : undefined}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          ) : (
            <ChevronRight className="h-3 w-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          )}
          <Terminal className="h-3 w-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            Sessions
          </span>
        </button>
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {sessions.length}
        </span>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2.5 mt-1">
          {Object.entries(grouped).map(([tool, toolSessions]) => {
            const config = TOOL_CONFIG[tool as keyof typeof TOOL_CONFIG]
            if (!config) return null
            const Icon = config.icon

            return (
              <div key={tool}>
                <div className="flex items-center gap-1.5 mb-1.5 pl-0.5">
                  <Icon style={{ color: config.colorVar, width: 14, height: 14 }} />
                  <span className="text-[8px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {toolSessions.length} {toolSessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 pl-0.5">
                  {toolSessions.map((session) => (
                    <div
                      key={session.id}
                      className="group/session flex items-center gap-1.5 rounded-md px-2 py-1"
                      style={{
                        background: config.bgTint,
                        border: `1px solid ${config.borderTint}`,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[10px] font-mono truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {session.command}
                        </div>
                        <div className="text-[8px] mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                          {session.workingPath} · {formatRelativeTime(session.createdAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCopy(session) }}
                        className="flex-shrink-0 p-1 rounded transition-colors"
                        style={{
                          background: config.buttonBg,
                          border: `1px solid ${config.buttonBorder}`,
                          color: copiedId === session.id ? 'var(--status-done)' : config.colorVar,
                        }}
                        title={copiedId === session.id ? 'Copied!' : 'Copy to terminal'}
                      >
                        <Terminal className="h-2.5 w-2.5" />
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDelete(session.id) }}
                          className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover/session:opacity-100 transition-opacity"
                          style={{ color: 'var(--destructive)' }}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
