'use client'

import * as React from 'react'
import { IconButton } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Tip } from '@/components/ui/tooltip'
import { GitHubPrBadge } from './github-pr-badge'
import { GitHubIssueBadge } from './github-issue-badge'
import { AzureWorkItemBadge } from './azure-workitem-badge'
import { AzureIcon, GitHubIcon } from './integration-badge'

export { AzureIcon, GitHubIcon }

type LinkType = 'github' | 'github-issue' | 'azure'

export function detectUrlType(url: string): LinkType | 'unknown' {
  if (/github\.com\/.+\/pull\/\d+/.test(url)) return 'github'
  if (/github\.com\/.+\/issues\/\d+/.test(url)) return 'github-issue'
  if (/dev\.azure\.com|visualstudio\.com/.test(url)) return 'azure'
  return 'unknown'
}

const LINK_COPY: Record<LinkType, { name: string; placeholder: string }> = {
  github: {
    name: 'Pull request link',
    placeholder: 'Paste a pull request link',
  },
  'github-issue': { name: 'Issue link', placeholder: 'Paste an issue link' },
  azure: { name: 'Work item link', placeholder: 'Paste a work item link' },
}

function renderBadgeForType(type: LinkType, url: string) {
  if (type === 'github') return <GitHubPrBadge url={url} />
  if (type === 'github-issue') return <GitHubIssueBadge url={url} />
  return <AzureWorkItemBadge url={url} />
}

function BrandIcon({ type }: { type: LinkType }) {
  return type === 'azure' ? <AzureIcon /> : <GitHubIcon />
}

interface SingleUrlFieldProps {
  value: string
  onChange: (value: string) => void
  type: LinkType
  disabled?: boolean
  /** Id for the input, so a visible label can point at it. */
  id?: string
}

export function SingleUrlField({
  value,
  onChange,
  type,
  disabled,
  id,
}: SingleUrlFieldProps) {
  const copy = LINK_COPY[type]

  if (value.trim()) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        {renderBadgeForType(type, value.trim())}
        <IconButton
          icon="trash"
          label={`Remove ${copy.name.toLowerCase()}`}
          size="sm"
          onClick={() => onChange('')}
          className="-my-1.5"
        />
      </div>
    )
  }

  return (
    <Input
      id={id}
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={copy.placeholder}
      aria-label={id ? undefined : copy.name}
      leading={<BrandIcon type={type} />}
    />
  )
}

interface UrlListFieldProps {
  type: LinkType
  urls: string[]
  onAdd: (url: string) => void
  onRemove: (index: number) => void
  inputValue: string
  onInputChange: (value: string) => void
  disabled?: boolean
  compact?: boolean
  /** Id for the input, so a visible label can point at it. */
  id?: string
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
  id,
}: UrlListFieldProps) {
  const copy = LINK_COPY[type]

  const handleAdd = () => {
    const url = inputValue.trim()
    if (!url) return
    onAdd(url)
    onInputChange('')
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {urls.map((url, index) => (
        <div key={url} className="group/dep flex min-w-0 items-center gap-1">
          {renderBadgeForType(type, url)}
          <IconButton
            icon="trash"
            label={`Remove ${copy.name.toLowerCase()}`}
            size="sm"
            onClick={() => onRemove(index)}
            className="-my-1.5 opacity-0 group-focus-within/dep:opacity-100 group-hover/dep:opacity-100"
          />
        </div>
      ))}
      <Input
        id={id}
        type="url"
        size={compact ? 'sm' : 'md'}
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
        placeholder={copy.placeholder}
        aria-label={id ? undefined : copy.name}
        leading={<BrandIcon type={type} />}
        trailing={
          <span className="dd-input__affix">
            <Tip label="Add link">
              <button
                type="button"
                className="dd-input__btn"
                onClick={handleAdd}
                disabled={!inputValue.trim()}
                aria-label={`Add ${copy.name.toLowerCase()}`}
              >
                <Icon name="plus" />
              </button>
            </Tip>
          </span>
        }
      />
    </div>
  )
}
