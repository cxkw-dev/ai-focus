'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Minus } from 'lucide-react'
import { useEvalEntries, type EvalEntry } from '@/lib/eval-store'
import { CategoryBadge } from '@/components/review/category-badge'

function ResultCard({ entry }: { entry: EvalEntry }) {
  if (entry.outcome?.created && entry.outcome.title && entry.outcome.category) {
    return (
      <div className="flex w-full items-center gap-2">
        <Check
          className="size-3.5 shrink-0"
          style={{ color: 'var(--status-done)' }}
        />
        <span
          className="truncate text-xs font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {entry.outcome.title}
        </span>
        <CategoryBadge category={entry.outcome.category} />
      </div>
    )
  }

  return (
    <div className="flex w-full items-center gap-2">
      <Minus className="size-3.5 shrink-0 opacity-60" />
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Not an accomplishment
      </span>
    </div>
  )
}

function CardContent({ entry }: { entry: EvalEntry }) {
  if (entry.stage === 'analyzing') {
    return (
      <div className="flex w-full items-center gap-2">
        <Loader2
          className="size-3.5 shrink-0 animate-spin"
          style={{ color: 'var(--primary)' }}
        />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Analyzing task...
        </span>
      </div>
    )
  }

  if (entry.stage === 'classifying') {
    return (
      <div className="flex w-full items-center gap-2">
        <Loader2
          className="size-3.5 shrink-0 animate-spin"
          style={{ color: 'var(--primary)' }}
        />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Classifying...
        </span>
      </div>
    )
  }

  return <ResultCard entry={entry} />
}

export function EvalStatus() {
  const entries = useEvalEntries()
  const latest = entries.size > 0 ? Array.from(entries.values()).pop()! : null

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-50"
      style={{ maxWidth: '320px' }}
    >
      <AnimatePresence mode="wait">
        {latest && (
          <motion.div
            key={latest.todoId}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            layout
            className="pointer-events-auto rounded-xl border shadow-xl backdrop-blur-md"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--surface) 95%, transparent)',
              borderColor: 'var(--border-color)',
              padding: '10px 14px',
            }}
          >
            <CardContent entry={latest} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
