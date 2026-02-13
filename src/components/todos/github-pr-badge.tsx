'use client'

import { GitPullRequest, GitMerge, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGithubPrStatus, useGithubPrStatuses } from '@/hooks/use-github-pr-status'

const CHIP_BASE = 'h-5 px-1.5 rounded text-[10px] font-medium inline-flex items-center gap-1 transition-colors'

const STATE_CONFIG = {
  open: { color: '#3fb950', icon: GitPullRequest, label: 'Open' },
  merged: { color: '#a371f7', icon: GitMerge, label: 'Merged' },
  closed: { color: '#f85149', icon: GitPullRequest, label: 'Closed' },
} as const

interface GitHubPrBadgeProps {
  url: string
  showTitle?: boolean
}

export function GitHubPrBadge({ url, showTitle }: GitHubPrBadgeProps) {
  const { data, isLoading, isError } = useGithubPrStatus(url)

  // Extract PR number from URL as fallback
  const match = url.match(/\/pull\/(\d+)/)
  const prNumber = data?.number ?? (match ? match[1] : '?')

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
        <span>#{prNumber}</span>
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
        <GitPullRequest className="h-3 w-3" />
        <span>#{prNumber}</span>
      </a>
    )
  }

  const config = STATE_CONFIG[data.state]
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
      title={`${data.title} — ${config.label}${data.draft ? ' (Draft)' : ''}`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
      <span>#{data.number}</span>
    </a>
  )

  if (!showTitle) return chip

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      {chip}
      <span
        className="text-[10px] truncate"
        style={{ color: 'var(--text-muted)' }}
      >
        {data.title}
      </span>
    </span>
  )
}

interface GitHubPrRowProps {
  urls: string[]
  showTitle?: boolean
}

export function GitHubPrRow({ urls, showTitle }: GitHubPrRowProps) {
  const { isLoading, allMergedOrClosed, allMerged } = useGithubPrStatuses(urls)

  let label: string
  let labelColor: string

  if (isLoading) {
    label = 'Checking PRs'
    labelColor = 'var(--text-muted)'
  } else if (allMerged) {
    label = 'PRs merged'
    labelColor = '#a371f7'
  } else if (allMergedOrClosed) {
    label = 'PRs closed'
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
        {allMergedOrClosed && !isLoading && <Check className="h-3 w-3" />}
        {label}
      </span>
      {urls.map((url) => (
        <GitHubPrBadge key={url} url={url} showTitle={showTitle} />
      ))}
    </div>
  )
}
