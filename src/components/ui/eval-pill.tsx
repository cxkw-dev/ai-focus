'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Minus } from 'lucide-react'
import { useEvalEntries, type EvalEntry } from '@/lib/eval-store'
import { CategoryBadge } from '@/components/review/category-badge'

function EvalEntryContent({ entry }: { entry: EvalEntry }) {
  if (entry.stage === 'analyzing') {
    return (
      <>
        <Loader2 className="size-3.5 shrink-0 animate-spin" style={{ color: 'var(--primary)' }} />
        <span className="truncate">Analyzing task…</span>
      </>
    )
  }

  if (entry.stage === 'classifying') {
    return (
      <>
        <Loader2 className="size-3.5 shrink-0 animate-spin" style={{ color: 'var(--primary)' }} />
        <span className="truncate">Classifying…</span>
      </>
    )
  }

  // result stage
  if (entry.outcome?.created && entry.outcome.title && entry.outcome.category) {
    return (
      <>
        <Check className="size-3.5 shrink-0" style={{ color: 'var(--status-done)' }} />
        <span className="truncate max-w-64">{entry.outcome.title}</span>
        <CategoryBadge category={entry.outcome.category} />
      </>
    )
  }

  return (
    <>
      <Minus className="size-3.5 shrink-0 opacity-60" />
      <span className="truncate">Not an accomplishment</span>
    </>
  )
}

export function EvalStatus() {
  const entries = useEvalEntries()

  const latest = entries.size > 0 ? Array.from(entries.values()).pop()! : null

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence mode="wait">
        {latest && (
          <motion.div
            key={latest.todoId + latest.stage}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--surface) 90%, transparent)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            <EvalEntryContent entry={latest} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
