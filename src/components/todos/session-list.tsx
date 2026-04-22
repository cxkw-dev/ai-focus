'use client'

import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, ChevronRight, Terminal, X } from 'lucide-react'
import type { IconType } from 'react-icons'
import { SiAnthropic, SiOpenai } from 'react-icons/si'
import { cn, formatRelativeTime } from '@/lib/utils'
import {
  SESSION_TOOL_VALUES,
  type Session,
  type SessionTool,
} from '@/types/todo'

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
  const shouldReduceMotion = useReducedMotion()
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
          {sessionGroups.map(({ tool, toolSessions }) => {
            const config = TOOL_CONFIG[tool]
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
                  {toolSessions.map((session) => {
                    const feedbackState =
                      copyFeedback?.sessionId === session.id
                        ? copyFeedback.status
                        : null
                    const isCopied = feedbackState === 'copied'
                    const isError = feedbackState === 'error'

                    return (
                      <motion.div
                        key={session.id}
                        initial={false}
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : isCopied
                              ? { scale: [1, 0.992, 1] }
                              : isError
                                ? { x: [0, -2, 2, 0] }
                                : { scale: 1, x: 0 }
                        }
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                        className="group/session flex items-center gap-1.5 rounded-md px-2 py-1"
                        style={{
                          background: isCopied
                            ? 'color-mix(in srgb, var(--status-done) 10%, var(--surface-2) 90%)'
                            : isError
                              ? 'color-mix(in srgb, var(--destructive) 8%, var(--surface-2) 92%)'
                              : config.bgTint,
                          border: isCopied
                            ? '1px solid color-mix(in srgb, var(--status-done) 34%, transparent)'
                            : isError
                              ? '1px solid color-mix(in srgb, var(--destructive) 34%, transparent)'
                              : `1px solid ${config.borderTint}`,
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
                        <motion.button
                          type="button"
                          whileTap={
                            shouldReduceMotion ? undefined : { scale: 0.94 }
                          }
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleCopy(session)
                          }}
                          className="relative flex-shrink-0 overflow-hidden rounded-full px-2 py-1 transition-colors duration-150"
                          style={{
                            background: isCopied
                              ? 'color-mix(in srgb, var(--status-done) 16%, transparent)'
                              : isError
                                ? 'color-mix(in srgb, var(--destructive) 14%, transparent)'
                                : config.buttonBg,
                            border: isCopied
                              ? '1px solid color-mix(in srgb, var(--status-done) 28%, transparent)'
                              : isError
                                ? '1px solid color-mix(in srgb, var(--destructive) 26%, transparent)'
                                : `1px solid ${config.buttonBorder}`,
                            color: isCopied
                              ? 'var(--status-done)'
                              : isError
                                ? 'var(--destructive)'
                                : config.colorVar,
                          }}
                          aria-label={
                            isCopied
                              ? 'Session command copied'
                              : isError
                                ? 'Copy session command failed'
                                : 'Copy session command'
                          }
                          title={
                            isCopied
                              ? 'Copied session command'
                              : isError
                                ? 'Copy failed, click to retry'
                                : 'Copy session command'
                          }
                        >
                          <AnimatePresence>
                            {(isCopied || isError) && !shouldReduceMotion && (
                              <motion.span
                                aria-hidden
                                initial={{ opacity: 0.3, scale: 0.7 }}
                                animate={{ opacity: 0, scale: 1.4 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: isCopied
                                    ? 'color-mix(in srgb, var(--status-done) 18%, transparent)'
                                    : 'color-mix(in srgb, var(--destructive) 16%, transparent)',
                                }}
                              />
                            )}
                          </AnimatePresence>
                          <AnimatePresence initial={false} mode="wait">
                            <motion.span
                              key={feedbackState ?? 'idle'}
                              initial={
                                shouldReduceMotion
                                  ? false
                                  : { opacity: 0, scale: 0.88, y: 2 }
                              }
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={
                                shouldReduceMotion
                                  ? undefined
                                  : { opacity: 0, scale: 0.9, y: -2 }
                              }
                              transition={{ duration: 0.16, ease: 'easeOut' }}
                              className="relative z-10 inline-flex items-center gap-1"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-2.5 w-2.5" />
                                  <span className="text-[9px] font-semibold">
                                    Copied
                                  </span>
                                </>
                              ) : isError ? (
                                <span className="text-[9px] font-semibold">
                                  Retry
                                </span>
                              ) : (
                                <Terminal className="h-2.5 w-2.5" />
                              )}
                            </motion.span>
                          </AnimatePresence>
                        </motion.button>
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
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
