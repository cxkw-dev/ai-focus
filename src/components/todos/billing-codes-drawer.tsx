'use client'

import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Copy, DollarSign, X } from 'lucide-react'
import { buildBillingCodeTitle, type BillingCodeEntry } from '@/lib/labels'

interface BillingCodesDrawerProps {
  entries: BillingCodeEntry[]
  open: boolean
  onClose: () => void
}

type CopyFeedback = {
  entryId: string
  status: 'copied' | 'error'
}

export function BillingCodesDrawer({
  entries,
  open,
  onClose,
}: BillingCodesDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null)
  const feedbackTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const shouldReduceMotion = useReducedMotion()
  const [copyFeedback, setCopyFeedback] = React.useState<CopyFeedback | null>(
    null,
  )
  const clearFeedbackTimeout = React.useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = null
    }
  }, [])
  const groupedEntries = React.useMemo(() => {
    const groups = new Map<
      string,
      { labelName: string; labelColor: string; entries: BillingCodeEntry[] }
    >()

    entries.forEach((entry) => {
      const existingGroup = groups.get(entry.labelId)

      if (existingGroup) {
        existingGroup.entries.push(entry)
        return
      }

      groups.set(entry.labelId, {
        labelName: entry.labelName,
        labelColor: entry.labelColor,
        entries: [entry],
      })
    })

    return Array.from(groups.values())
  }, [entries])
  const showLabelContext = groupedEntries.length > 1

  const setTemporaryFeedback = React.useCallback((feedback: CopyFeedback) => {
    setCopyFeedback(feedback)

    clearFeedbackTimeout()

    feedbackTimeoutRef.current = setTimeout(
      () => {
        setCopyFeedback(null)
        feedbackTimeoutRef.current = null
      },
      feedback.status === 'copied' ? 1600 : 2200,
    )
  }, [clearFeedbackTimeout])

  const handleCopy = React.useCallback(
    async (entry: BillingCodeEntry) => {
      try {
        await navigator.clipboard.writeText(entry.billingCode.code)
        setTemporaryFeedback({
          entryId: entry.billingCode.id,
          status: 'copied',
        })
      } catch {
        setTemporaryFeedback({
          entryId: entry.billingCode.id,
          status: 'error',
        })
      }
    },
    [setTemporaryFeedback],
  )

  React.useEffect(() => {
    if (!open) return

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (target.closest('.todo-billing-tab')) return
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  React.useLayoutEffect(() => {
    if (open) return

    setCopyFeedback(null)
    clearFeedbackTimeout()
  }, [open, clearFeedbackTimeout])

  React.useEffect(() => clearFeedbackTimeout, [clearFeedbackTimeout])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={drawerRef}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute inset-y-0 right-0 z-30 overflow-hidden rounded-lg"
          style={{
            backgroundColor: 'var(--surface)',
            boxShadow: '0 0 16px rgba(0,0,0,0.2)',
            transformOrigin: 'right center',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-full w-full flex-col">
            <div
              className="flex shrink-0 items-center justify-between border-b px-3 py-1.5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-1.5">
                <DollarSign
                  className="h-3 w-3"
                  style={{ color: 'var(--status-done)' }}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide uppercase"
                  style={{ color: 'var(--status-done)' }}
                >
                  Billing
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded p-0.5 transition-colors hover:bg-black/10"
                aria-label="Close billing drawer"
              >
                <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2.5">
              {entries.length === 0 ? (
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No billing codes linked to this task.
                </p>
              ) : (
                <div className="space-y-4">
                  {groupedEntries.map((group) => (
                    <div key={group.labelName} className="space-y-2">
                      {showLabelContext && (
                        <div className="flex items-center gap-2 px-0.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: group.labelColor }}
                          />
                          <p
                            className="truncate text-[9px] font-semibold tracking-[0.16em] uppercase"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {group.labelName}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {group.entries.map((entry) => {
                          const feedbackState =
                            copyFeedback?.entryId === entry.billingCode.id
                              ? copyFeedback.status
                              : null
                          const isCopied = feedbackState === 'copied'
                          const isError = feedbackState === 'error'

                          return (
                            <motion.button
                              key={entry.billingCode.id}
                              type="button"
                              onClick={() => void handleCopy(entry)}
                              initial={false}
                              animate={
                                shouldReduceMotion
                                  ? undefined
                                  : isCopied
                                    ? { scale: [1, 0.992, 1] }
                                    : { scale: 1 }
                              }
                              transition={{ duration: 0.26, ease: 'easeOut' }}
                              className="group relative block w-full rounded-md border px-3 py-2.5 text-left transition-colors duration-150 hover:border-[color:var(--primary)]/40"
                              style={{
                                backgroundColor: isCopied
                                  ? 'color-mix(in srgb, var(--status-done) 10%, var(--surface-2) 90%)'
                                  : isError
                                    ? 'color-mix(in srgb, var(--destructive) 10%, var(--surface-2) 90%)'
                                    : 'var(--surface-2)',
                                borderColor: isCopied
                                  ? 'color-mix(in srgb, var(--status-done) 40%, transparent)'
                                  : isError
                                    ? 'color-mix(in srgb, var(--destructive) 40%, transparent)'
                                    : 'var(--border-color)',
                              }}
                              title={buildBillingCodeTitle(
                                entry.labelName,
                                entry.billingCode,
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className="text-[9px] font-semibold tracking-[0.16em] uppercase"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {entry.billingCode.type}
                                </span>
                                <AnimatePresence initial={false} mode="wait">
                                  <motion.span
                                    key={feedbackState ?? 'idle'}
                                    initial={
                                      shouldReduceMotion
                                        ? false
                                        : { opacity: 0, scale: 0.9 }
                                    }
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={
                                      shouldReduceMotion
                                        ? undefined
                                        : { opacity: 0, scale: 0.9 }
                                    }
                                    transition={{
                                      duration: 0.16,
                                      ease: 'easeOut',
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium"
                                    style={{
                                      color: isCopied
                                        ? 'var(--status-done)'
                                        : isError
                                          ? 'var(--destructive)'
                                          : 'var(--text-muted)',
                                    }}
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="h-3 w-3" />
                                        Copied
                                      </>
                                    ) : isError ? (
                                      'Retry'
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        Copy
                                      </>
                                    )}
                                  </motion.span>
                                </AnimatePresence>
                              </div>

                              <div
                                className="mt-1.5 font-mono text-xs leading-snug font-semibold break-all"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {entry.billingCode.code}
                              </div>

                              {entry.billingCode.description && (
                                <p
                                  className="mt-1.5 text-[10px] leading-relaxed break-words"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {entry.billingCode.description}
                                </p>
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
