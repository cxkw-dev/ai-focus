'use client'

import * as React from 'react'
import type { IconType } from 'react-icons'
import { SiAnthropic } from 'react-icons/si'
import { TbBrandOpenai } from 'react-icons/tb'
import { IconButton } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn, formatRelativeTime } from '@/lib/utils'
import {
  SESSION_TOOL_VALUES,
  type Session,
  type SessionTool,
} from '@/types/todo'

/** Brand marks identify the tool; they stay neutral so they don't read as status. */
const TOOL_ICONS = {
  claude: SiAnthropic,
  codex: TbBrandOpenai,
} satisfies Record<SessionTool, IconType>

interface SessionListProps {
  sessions: Session[]
  onDelete?: (sessionId: string) => void
  compact?: boolean
}

type CopyFeedback = {
  sessionId: string
  status: 'copied' | 'error'
}

export function SessionList({
  sessions,
  onDelete,
  compact = false,
}: SessionListProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [copyFeedback, setCopyFeedback] = React.useState<CopyFeedback | null>(
    null,
  )
  const resetTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const clearFeedbackTimeout = React.useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
  }, [])

  const sessionGroups = React.useMemo(() => {
    const groups = Object.fromEntries(
      SESSION_TOOL_VALUES.map((tool) => [tool, [] as Session[]]),
    ) as Record<SessionTool, Session[]>

    for (const session of sessions) {
      groups[session.tool].push(session)
    }

    return SESSION_TOOL_VALUES.flatMap((tool) => {
      const toolSessions = groups[tool]
      return toolSessions.length > 0 ? [{ tool, toolSessions }] : []
    })
  }, [sessions])

  const setTemporaryFeedback = React.useCallback(
    (feedback: CopyFeedback) => {
      setCopyFeedback(feedback)
      clearFeedbackTimeout()

      resetTimeoutRef.current = setTimeout(
        () => {
          setCopyFeedback(null)
          resetTimeoutRef.current = null
        },
        feedback.status === 'copied' ? 1600 : 2200,
      )
    },
    [clearFeedbackTimeout],
  )

  const handleCopy = React.useCallback(
    async (session: Session) => {
      try {
        await navigator.clipboard.writeText(session.command)
        setTemporaryFeedback({ sessionId: session.id, status: 'copied' })
      } catch {
        setTemporaryFeedback({ sessionId: session.id, status: 'error' })
      }
    },
    [setTemporaryFeedback],
  )

  React.useEffect(() => {
    return clearFeedbackTimeout
  }, [clearFeedbackTimeout])

  if (sessions.length === 0) {
    return null
  }

  return (
    <div className={cn(!compact && 'border-border border-t pt-1.5')}>
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
        className={cn(
          'rounded-ctl inline-flex items-center gap-1 transition-colors',
          compact
            ? 'text-text text-sm font-semibold'
            : 'text-muted hover:text-text text-xs font-medium',
        )}
      >
        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} />
        Sessions
        <span className="text-quiet font-mono tabular-nums">
          {sessions.length}
        </span>
      </button>

      {expanded && (
        <div className="mt-1.5 flex flex-col gap-2.5">
          {sessionGroups.map(({ tool, toolSessions }) => {
            const ToolIcon = TOOL_ICONS[tool]

            return (
              <div key={tool} className="flex flex-col gap-0.5">
                <div className="text-quiet flex items-center gap-1.5 text-xs">
                  <ToolIcon className="text-muted size-[1.15em] flex-none" />
                  <span>
                    {toolSessions.length}{' '}
                    {toolSessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
                <ul className="flex flex-col">
                  {toolSessions.map((session) => {
                    const feedbackState =
                      copyFeedback?.sessionId === session.id
                        ? copyFeedback.status
                        : null
                    const isCopied = feedbackState === 'copied'
                    const isError = feedbackState === 'error'

                    return (
                      <li
                        key={session.id}
                        className="group/session rounded-ctl ease-gentle hover:bg-wash flex items-center gap-1 py-0.5 pr-0.5 pl-1.5 transition-colors duration-[var(--dd-dur-fast)]"
                      >
                        <div className="min-w-0 flex-1 font-mono text-xs">
                          <div className="text-text truncate">
                            {session.command}
                          </div>
                          <div className="text-quiet flex items-center gap-1.5">
                            <span className="truncate">
                              {session.workingPath} ·{' '}
                              {formatRelativeTime(session.createdAt)}
                            </span>
                            {isCopied && (
                              <span className="animate-fade-in font-body text-ok inline-flex flex-none items-center gap-1">
                                <Icon name="check" />
                                Copied
                              </span>
                            )}
                            {isError && (
                              <span className="animate-fade-in font-body text-bad flex-none">
                                Copy failed
                              </span>
                            )}
                          </div>
                        </div>
                        <IconButton
                          icon={isCopied ? 'check' : isError ? 'error' : 'copy'}
                          label={
                            isCopied
                              ? 'Session command copied'
                              : isError
                                ? 'Copy session command failed'
                                : 'Copy session command'
                          }
                          size="sm"
                          className={cn(
                            isCopied && 'text-ok',
                            isError && 'text-bad',
                          )}
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleCopy(session)
                          }}
                        />
                        {onDelete && (
                          <IconButton
                            icon="trash"
                            label="Delete session"
                            size="sm"
                            className="opacity-0 group-focus-within/session:opacity-100 group-hover/session:opacity-100 focus-visible:opacity-100"
                            onClick={(event) => {
                              event.stopPropagation()
                              onDelete(session.id)
                            }}
                          />
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
