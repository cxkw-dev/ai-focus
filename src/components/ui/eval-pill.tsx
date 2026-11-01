'use client'

import { Icon } from '@/components/ui/icon'
import { useEvalEntries, type EvalEntry } from '@/lib/eval-store'
import { CategoryBadge } from '@/components/review/category-badge'

function PillContent({ entry }: { entry: EvalEntry }) {
  if (entry.stage === 'analyzing' || entry.stage === 'classifying') {
    return (
      <span className="dd-status-dot dd-status-dot--info dd-status-dot--live dd-status-dot--sm">
        {entry.stage === 'analyzing' ? 'Analyzing task…' : 'Classifying…'}
      </span>
    )
  }

  if (entry.outcome?.created && entry.outcome.title && entry.outcome.category) {
    return (
      <>
        <span
          className="dd-status-dot dd-status-dot--online dd-status-dot--sm"
          role="img"
          aria-label="Added as an accomplishment"
        />
        <span className="min-w-0 truncate font-medium">
          {entry.outcome.title}
        </span>
        <CategoryBadge category={entry.outcome.category} />
      </>
    )
  }

  return (
    <span className="dd-status-dot dd-status-dot--offline dd-status-dot--sm dd-status-dot--muted">
      Not an accomplishment
    </span>
  )
}

/**
 * The local-AI accomplishment classifier's progress for the latest completed task: a small floating chip at the
 * bottom left (toasts own the bottom right) with a status dot for the stage, on the float surface. It holds nothing
 * to click, so it lets clicks through to whatever it covers.
 */
export function EvalStatus() {
  const entries = useEvalEntries()
  const latest = Array.from(entries.values()).at(-1)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-(--dd-z-toast) max-w-[min(22rem,calc(100vw-var(--dd-u)*8))]"
    >
      {latest && (
        <div
          key={latest.todoId}
          className="rounded-pill bg-float shadow-float flex max-w-full animate-[dd-toast-in_var(--dd-dur)_var(--dd-ease)_both] items-center gap-2 py-1.5 pr-3 pl-2.5 text-xs motion-reduce:animate-none"
        >
          <Icon name="ai" label="Local AI" className="text-muted shrink-0" />
          <PillContent entry={latest} />
        </div>
      )}
    </div>
  )
}
