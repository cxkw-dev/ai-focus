'use client'

import { ArrowDown, ShieldCheck } from 'lucide-react'
import { useGithubPrStatuses } from '@/hooks/use-github-pr-status'
import { StatusChip, TodoLabelChip } from './todo-display'
import type { Todo } from '@/types/todo'

export function CollapsedTodoRow({
  todo,
  onClick,
}: {
  todo: Todo
  onClick: () => void
}) {
  const myPrUrls = todo.myPrUrls ?? []
  const { statuses } = useGithubPrStatuses(myPrUrls)

  const openStatuses = statuses.filter(
    (s) => s && s.state === 'open' && s.behindBy != null,
  )
  const maxBehind = openStatuses.reduce(
    (max, s) => Math.max(max, s!.behindBy!),
    0,
  )
  const hasOpenPrs = openStatuses.length > 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 transition-opacity hover:opacity-70"
      style={{
        backgroundColor: 'var(--surface-2)',
        opacity: 0.5,
      }}
    >
      <StatusChip status={todo.status} className="flex-shrink-0" />
      <span
        className="min-w-0 flex-1 truncate text-[11px]"
        style={{ color: 'var(--text-muted)' }}
      >
        {todo.title}
      </span>
      {hasOpenPrs &&
        (maxBehind > 0 ? (
          <span
            className="inline-flex flex-shrink-0 items-center gap-px text-[10px] font-semibold"
            style={{ color: '#d29922' }}
            title={`${maxBehind} commit${maxBehind !== 1 ? 's' : ''} behind main`}
          >
            <ArrowDown className="h-2.5 w-2.5" />
            {maxBehind}
          </span>
        ) : (
          <span className="flex-shrink-0" title="Up to date with main">
            <ShieldCheck className="h-3 w-3" style={{ color: '#58a6ff' }} />
          </span>
        ))}
      {todo.labels?.map((label) => (
        <TodoLabelChip key={label.id} label={label} className="flex-shrink-0" />
      ))}
      <span
        className="flex-shrink-0 font-mono text-[9px] font-semibold"
        style={{ color: 'var(--text-muted)', opacity: 0.6 }}
      >
        #{todo.taskNumber}
      </span>
    </div>
  )
}
