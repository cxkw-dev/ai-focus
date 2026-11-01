'use client'

import { Icon, type IconName } from '@/components/ui/icon'
import { useGithubIssueStatus } from '@/hooks/use-github-issue-status'
import type { GitHubIssueStatus } from '@/types/todo'
import {
  IntegrationBadge,
  IntegrationBadgeLoading,
  IntegrationTitleRow,
  type IntegrationIntent,
} from './integration-badge'

// `danger` (a circle with a mark) is the closest dd icon to GitHub's open-issue glyph.
const ISSUE_ICON: IconName = 'danger'

function getBadgeConfig(data: GitHubIssueStatus): {
  intent: IntegrationIntent
  icon: IconName
  label: string
} {
  if (data.state === 'closed') {
    if (data.stateReason === 'not_planned') {
      return { intent: 'neutral', icon: 'minus', label: 'Not planned' }
    }
    return { intent: 'ok', icon: 'success', label: 'Done' }
  }
  return { intent: 'info', icon: ISSUE_ICON, label: 'Open' }
}

interface GitHubIssueBadgeProps {
  url: string
  showTitle?: boolean
  status?: GitHubIssueStatus
  isStatusLoading?: boolean
  fetchStatus?: boolean
}

export function GitHubIssueBadge({
  url,
  showTitle,
  status,
  isStatusLoading,
  fetchStatus = true,
}: GitHubIssueBadgeProps) {
  const statusQuery = useGithubIssueStatus(fetchStatus && !status ? url : '')
  const data = status ?? statusQuery.data
  const isLoading = data ? false : (isStatusLoading ?? statusQuery.isLoading)
  const isError = data ? false : fetchStatus ? statusQuery.isError : !isLoading

  const match = url.match(/\/issues\/(\d+)/)
  const issueNumber = data?.number ?? (match ? match[1] : '?')

  if (isLoading) return <IntegrationBadgeLoading reference={issueNumber} />

  if (isError || !data) {
    return (
      <IntegrationBadge
        url={url}
        reference={issueNumber}
        icon={<Icon name={ISSUE_ICON} />}
      />
    )
  }

  const config = getBadgeConfig(data)
  const assignees = data.assignees.length
    ? ` (${data.assignees.join(', ')})`
    : ''
  const badge = (
    <IntegrationBadge
      url={url}
      reference={data.number}
      icon={<Icon name={config.icon} />}
      intent={config.intent}
      label={config.label}
      tip={`${data.title} — ${config.label}${assignees}`}
    />
  )

  if (!showTitle) return badge

  return (
    <IntegrationTitleRow badge={badge} title={data.title}>
      {data.labels.length > 0 && (
        <span className="flex shrink-0 items-center gap-1">
          {data.labels.slice(0, 3).map((label) => (
            // GitHub label colours are data, so they stay inline.
            <span
              key={label.name}
              role="img"
              aria-label={label.name}
              title={label.name}
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: label.color }}
            />
          ))}
        </span>
      )}
    </IntegrationTitleRow>
  )
}
