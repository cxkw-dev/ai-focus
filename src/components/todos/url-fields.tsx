'use client'

import * as React from 'react'
import { Plus, X } from 'lucide-react'
import { GitHubPrBadge } from './github-pr-badge'
import { GitHubIssueBadge } from './github-issue-badge'
import { AzureWorkItemBadge } from './azure-workitem-badge'

export function GitHubIcon({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function AzureIcon({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M7.47 1.4L3.77 5.5 1 10.86h3.15L7.47 1.4zm.93.09L5.84 7.72l3.97 4.56H3.1L9.9 14.6h4.67L8.4 1.49z" />
    </svg>
  )
}

export function detectUrlType(
  url: string,
): 'github' | 'github-issue' | 'azure' | 'unknown' {
  if (/github\.com\/.+\/pull\/\d+/.test(url)) return 'github'
  if (/github\.com\/.+\/issues\/\d+/.test(url)) return 'github-issue'
  if (/dev\.azure\.com|visualstudio\.com/.test(url)) return 'azure'
  return 'unknown'
}

interface SingleUrlFieldProps {
  value: string
  onChange: (value: string) => void
  type: 'github' | 'github-issue' | 'azure'
  disabled?: boolean
}

function renderBadgeForType(
  type: 'github' | 'github-issue' | 'azure',
  url: string,
) {
  if (type === 'github') return <GitHubPrBadge url={url} />
  if (type === 'github-issue') return <GitHubIssueBadge url={url} />
  return <AzureWorkItemBadge url={url} />
}

export function SingleUrlField({
  value,
  onChange,
  type,
  disabled,
}: SingleUrlFieldProps) {
  const Icon = type === 'azure' ? AzureIcon : GitHubIcon

  if (value.trim()) {
    return (
      <div className="flex items-center gap-2">
        {renderBadgeForType(type, value.trim())}
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex-shrink-0 transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors focus-within:border-[var(--primary)]"
      style={{
        backgroundColor:
          'color-mix(in srgb, var(--background) 50%, transparent)',
        borderColor: 'var(--border-color)',
      }}
    >
      <Icon
        className="h-3.5 w-3.5 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      />
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
        style={{ color: 'var(--text-primary)' }}
      />
    </div>
  )
}

interface UrlListFieldProps {
  type: 'github' | 'github-issue' | 'azure'
  urls: string[]
  onAdd: (url: string) => void
  onRemove: (index: number) => void
  inputValue: string
  onInputChange: (value: string) => void
  disabled?: boolean
  compact?: boolean
}

export function UrlListField({
  type,
  urls,
  onAdd,
  onRemove,
  inputValue,
  onInputChange,
  disabled,
  compact,
}: UrlListFieldProps) {
  const handleAdd = React.useCallback(() => {
    const url = inputValue.trim()
    if (!url) return
    onAdd(url)
    onInputChange('')
  }, [inputValue, onAdd, onInputChange])

  const Icon = type === 'azure' ? AzureIcon : GitHubIcon
  const py = compact ? 'py-1' : 'py-1.5'
  const px = compact ? 'px-2' : 'px-2.5'
  const textSize = compact ? 'text-xs' : 'text-sm'

  return (
    <div className="space-y-1.5">
      {urls.map((url, index) => (
        <div key={url} className="group/dep flex items-center gap-2">
          {renderBadgeForType(type, url)}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex-shrink-0 opacity-0 transition-opacity group-hover/dep:opacity-100"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div
        className={`flex items-center gap-2 rounded-md ${px} ${py} border transition-colors focus-within:border-[var(--primary)]`}
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--background) 50%, transparent)',
          borderColor: compact
            ? 'color-mix(in srgb, var(--border-color) 60%, transparent)'
            : 'var(--border-color)',
        }}
      >
        <Icon
          className="h-3.5 w-3.5 flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="url"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              handleAdd()
            }
          }}
          disabled={disabled}
          className={`flex-1 bg-transparent ${textSize} min-w-0 focus:outline-none`}
          style={{ color: 'var(--text-primary)' }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="flex-shrink-0 rounded px-1 text-xs font-medium transition-colors disabled:opacity-30"
          style={{ color: 'var(--primary)' }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
