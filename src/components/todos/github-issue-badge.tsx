'use client'

import { CircleDot, CheckCircle2, SkipForward, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGithubIssueStatus, useGithubIssueStatuses } from '@/hooks/use-github-issue-status'
import type { GitHubIssueStatus } from '@/types/todo'

const CHIP_BASE = 'h-5 px-1.5 rounded text-[10px] font-medium inline-flex items-center gap-1 transition-colors min-w-0 max-w-full whitespace-nowrap'

function getBadgeConfig(data: GitHubIssueStatus) {
  if (data.state === 'closed') {
    if (data.stateReason === 'not_planned') {
      return { color: '#8b949e', icon: SkipForward, label: 'Not Planned' }
    }
    return { color: '#a371f7', icon: CheckCircle2, label: 'Done' }
  }
  return { color: '#3fb950', icon: CircleDot, label: 'Open' }
}

interface GitHubIssueBadgeProps {
  url: string
  showTitle?: boolean
}

export function GitHubIssueBadge({ url, showTitle }: GitHubIssueBadgeProps) {
  const { data, isLoading, isError } = useGithubIssueStatus(url)

  const match = url.match(/\/issues\/(\d+)/)
  const issueNumber = data?.number ?? (match ? match[1] : '?')

  if (isLoading) {
    return (
      <span
        className={cn(CHIP_BASE)}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
          color: 'var(--text-muted)',
        }}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="truncate">#{issueNumber}</span>
      </span>
    )
  }

  if (isError || !data) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={cn(CHIP_BASE, 'hover:brightness-110 cursor-pointer no-underline')}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
          color: 'var(--text-muted)',
        }}
      >
        <CircleDot className="h-3 w-3" />
        <span className="truncate">#{issueNumber}</span>
      </a>
    )
  }

  const config = getBadgeConfig(data)
  const Icon = config.icon

  const chip = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(CHIP_BASE, 'hover:brightness-110 cursor-pointer no-underline flex-shrink-0')}
      style={{
        backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
        color: config.color,
      }}
      title={`${data.title} — ${config.label}${data.assignees.length ? ` (${data.assignees.join(', ')})` : ''}`}
    >
      <Icon className="h-3 w-3" />
      <span className="truncate max-w-[7rem]">{config.label}</span>
      <span className="shrink-0">#{data.number}</span>
    </a>
  )

  if (!showTitle) return chip

  return (
    <span className="flex w-full min-w-0 items-center gap-1.5">
      {chip}
      {data.labels.length > 0 && (
        <span className="flex items-center gap-1 flex-shrink-0">
          {data.labels.slice(0, 3).map((label) => (
            <span
              key={label.name}
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </span>
      )}
      <span
        className="min-w-0 flex-1 text-[10px] truncate"
        style={{ color: 'var(--text-muted)' }}
      >
        {data.title}
      </span>
    </span>
  )
}

interface GitHubIssueRowProps {
  urls: string[]
  showTitle?: boolean
}

export function GitHubIssueRow({ urls, showTitle }: GitHubIssueRowProps) {
  const { isLoading, allClosed } = useGithubIssueStatuses(urls)

  let label: string
  let labelColor: string

  if (isLoading) {
    label = 'Checking issues'
    labelColor = 'var(--text-muted)'
  } else if (allClosed) {
    label = 'Issues closed'
    labelColor = '#a371f7'
  } else {
    label = 'Waiting on'
    labelColor = 'var(--text-muted)'
  }

  return (
    <div
      className="flex items-center gap-1.5 flex-wrap pt-1.5"
      style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)' }}
    >
      <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: labelColor }}>
        {allClosed && !isLoading && <Check className="h-3 w-3" />}
        {label}
      </span>
      {urls.map((url) => (
        <GitHubIssueBadge key={url} url={url} showTitle={showTitle} />
      ))}
    </div>
  )
}
