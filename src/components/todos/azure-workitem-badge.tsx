'use client'

import { Loader2, Check, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAzureWorkItemStatus, useAzureWorkItemStatuses } from '@/hooks/use-azure-workitem-status'
import type { AzureWorkItemStatus } from '@/types/todo'

const CHIP_BASE = 'h-5 px-1.5 rounded text-[10px] font-medium inline-flex items-center gap-1 transition-colors'

function getBadgeConfig(data: AzureWorkItemStatus) {
  const state = data.state.toLowerCase()
  if (['done', 'closed', 'resolved'].includes(state)) return { color: '#3fb950', label: data.state }
  if (state === 'removed') return { color: '#f85149', label: 'Removed' }
  if (['active', 'new', 'committed'].includes(state)) return { color: '#58a6ff', label: data.state }
  return { color: '#d29922', label: data.state }
}

function extractWorkItemId(url: string): string {
  const match = url.match(/\/edit\/(\d+)/)
  return match ? match[1] : '?'
}

interface AzureWorkItemBadgeProps {
  url: string
  showTitle?: boolean
}

export function AzureWorkItemBadge({ url, showTitle }: AzureWorkItemBadgeProps) {
  const { data, isLoading, isError } = useAzureWorkItemStatus(url)

  const itemId = data?.id ?? extractWorkItemId(url)

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
        <span>#{itemId}</span>
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
        <span>#{itemId}</span>
      </a>
    )
  }

  const config = getBadgeConfig(data)

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
      title={`${data.title} — ${config.label}`}
    >
      <CircleDot className="h-3 w-3" />
      <span>{config.label}</span>
      <span>#{data.id}</span>
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

interface AzureWorkItemRowProps {
  urls: string[]
  showTitle?: boolean
}

export function AzureWorkItemRow({ urls, showTitle }: AzureWorkItemRowProps) {
  const { isLoading, allResolved } = useAzureWorkItemStatuses(urls)

  let label: string
  let labelColor: string

  if (isLoading) {
    label = 'Checking items'
    labelColor = 'var(--text-muted)'
  } else if (allResolved) {
    label = 'All resolved'
    labelColor = '#3fb950'
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
        {allResolved && !isLoading && <Check className="h-3 w-3" />}
        {label}
      </span>
      {urls.map((url) => (
        <AzureWorkItemBadge key={url} url={url} showTitle={showTitle} />
      ))}
    </div>
  )
}
