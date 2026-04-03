'use client'

import * as React from 'react'
import { ChevronDown, ChevronRight, Terminal, X } from 'lucide-react'
import type { IconType } from 'react-icons'
import { SiAnthropic, SiOpenai } from 'react-icons/si'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { Session } from '@/types/todo'

type SessionTool = Session['tool']

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
} satisfies Record<
  SessionTool,
  {
    icon: IconType
    colorVar: string
    bgTint: string
    borderTint: string
    buttonBg: string
    buttonBorder: string
  }
>

interface SessionListProps {
  sessions: Session[]
  onDelete?: (sessionId: string) => void
  compact?: boolean
}

export function SessionList({
  sessions,
  onDelete,
  compact = false,
}: SessionListProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const resetTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const groupedSessions = React.useMemo(() => {
    const groups: Partial<Record<SessionTool, Session[]>> = {}

    for (const session of sessions) {
      if (!groups[session.tool]) {
        groups[session.tool] = []
      }

      groups[session.tool]!.push(session)
    }

    return groups
  }, [sessions])

  const handleCopy = React.useCallback(async (session: Session) => {
    await navigator.clipboard.writeText(session.command)
    setCopiedId(session.id)

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
    }

    resetTimeoutRef.current = setTimeout(() => {
      setCopiedId(null)
      resetTimeoutRef.current = null
    }, 1500)
  }, [])

  React.useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  if (sessions.length === 0) {
    return null
  }

  return (
    <div
      className={cn(!compact && 'pt-1.5')}
      style={
        !compact
          ? {
              borderTop:
                '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
            }
          : undefined
      }
    >
      <div className="mb-1 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setExpanded((previous) => !previous)}
          className="flex cursor-pointer items-center gap-1.5 transition-opacity hover:opacity-80"
        >
          {expanded ? (
            <ChevronDown
              className="h-3 w-3"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            />
          ) : (
            <ChevronRight
              className="h-3 w-3"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            />
          )}
          <span
            className="text-[10px] font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)', opacity: 0.6 }}
          >
            Sessions
          </span>
        </button>
        <span
          className="text-[10px] font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {sessions.length}
        </span>
      </div>

      {expanded && (
        <div className="mt-1 flex flex-col gap-2.5">
          {Object.entries(groupedSessions).map(([tool, toolSessions]) => {
            if (!toolSessions) {
              return null
            }

            const config = TOOL_CONFIG[tool as SessionTool]
            const Icon = config.icon

            return (
              <div key={tool}>
                <div className="mb-1.5 flex items-center gap-1.5 pl-0.5">
                  <Icon
                    style={{ color: config.colorVar, width: 14, height: 14 }}
                  />
                  <span
                    className="text-[8px] tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {toolSessions.length}{' '}
                    {toolSessions.length === 1 ? 'session' : 'sessions'}
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
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate font-mono text-[10px]"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {session.command}
                        </div>
                        <div
                          className="mt-0.5 text-[8px]"
                          style={{
                            color: 'var(--text-muted)',
                            opacity: 0.6,
                          }}
                        >
                          {session.workingPath} ·{' '}
                          {formatRelativeTime(session.createdAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleCopy(session)
                        }}
                        className="flex-shrink-0 rounded p-1 transition-colors"
                        style={{
                          background: config.buttonBg,
                          border: `1px solid ${config.buttonBorder}`,
                          color:
                            copiedId === session.id
                              ? 'var(--status-done)'
                              : config.colorVar,
                        }}
                        title={
                          copiedId === session.id
                            ? 'Copied!'
                            : 'Copy to terminal'
                        }
                      >
                        <Terminal className="h-2.5 w-2.5" />
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onDelete(session.id)
                          }}
                          className="flex-shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover/session:opacity-100"
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
