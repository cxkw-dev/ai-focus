'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Copy, DollarSign, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  buildBillingCodeTitle,
  formatBillingCodeDisplay,
  type BillingCodeEntry,
} from '@/lib/labels'

interface BillingCodesDrawerProps {
  entries: BillingCodeEntry[]
  open: boolean
  onClose: () => void
}

export function BillingCodesDrawer({
  entries,
  open,
  onClose,
}: BillingCodesDrawerProps) {
  const { toast } = useToast()
  const drawerRef = React.useRef<HTMLDivElement>(null)
  const drawerWidth = 'min(17rem, calc(100% - 1rem), calc(100vw - 1.5rem))'

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
  const flatEntries = React.useMemo(
    () =>
      groupedEntries.flatMap((group) =>
        group.entries.map((entry) => ({
          ...entry,
          labelName: group.labelName,
        })),
      ),
    [groupedEntries],
  )

  const handleCopy = React.useCallback(
    async (entry: BillingCodeEntry) => {
      try {
        await navigator.clipboard.writeText(entry.billingCode.code)
        toast({
          title: 'Billing code copied',
          description: `${entry.labelName}: ${entry.billingCode.code}`,
        })
      } catch {
        toast({
          title: 'Copy failed',
          description: 'Unable to copy the billing code.',
          variant: 'destructive',
        })
      }
    },
    [toast],
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={drawerRef}
          initial={{ opacity: 0, x: 18, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 18, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute top-1.5 right-1.5 bottom-1.5 z-30 overflow-hidden rounded-lg"
          style={{
            width: drawerWidth,
            backgroundColor: 'color-mix(in srgb, var(--surface) 96%, transparent)',
            border: '1px solid color-mix(in srgb, var(--border-color) 78%, transparent)',
            boxShadow: '-8px 0 18px rgba(0,0,0,0.14)',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-full w-full flex-col">
            <div
              className="flex shrink-0 items-center justify-between border-b px-3 py-2"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--border-color) 78%, transparent)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <DollarSign
                  className="h-3.5 w-3.5"
                  style={{ color: 'var(--text-muted)' }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Billing
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded p-0.5 transition-colors hover:bg-white/5"
              >
                <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2.5">
              {flatEntries.length === 0 ? (
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  No billing codes linked to this task.
                </p>
              ) : (
                <div className="space-y-2">
                  {flatEntries.map((entry) => (
                    <button
                      key={entry.billingCode.id}
                      type="button"
                      onClick={() => void handleCopy(entry)}
                      className="w-full rounded-md border px-3 py-2 text-left transition-colors hover:bg-white/5"
                      style={{
                        borderColor:
                          'color-mix(in srgb, var(--border-color) 72%, transparent)',
                        backgroundColor:
                          'color-mix(in srgb, var(--surface-2) 56%, transparent)',
                      }}
                      title={buildBillingCodeTitle(
                        entry.labelName,
                        entry.billingCode,
                      )}
                    >
                      {showLabelContext && (
                        <div
                          className="mb-1 text-[10px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {entry.labelName}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div
                            className="truncate font-mono text-[11px] font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {formatBillingCodeDisplay(entry.billingCode)}
                          </div>
                          {entry.billingCode.description && (
                            <p
                              className="mt-1 text-[10px] leading-relaxed break-words"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {entry.billingCode.description}
                            </p>
                          )}
                        </div>
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium"
                          style={{
                            color: 'var(--text-muted)',
                            backgroundColor:
                              'color-mix(in srgb, var(--background) 26%, transparent)',
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </span>
                      </div>
                    </button>
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
