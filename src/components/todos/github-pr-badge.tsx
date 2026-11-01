'use client'

import type { ReactNode } from 'react'
import { GitMerge, GitPullRequest } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { useGithubPrStatus } from '@/hooks/use-github-pr-status'
import type { GitHubPrStatus } from '@/types/todo'
import {
  IntegrationBadge,
  IntegrationBadgeLoading,
  IntegrationTitleRow,
  type IntegrationIntent,
} from './integration-badge'

const prIcon = <GitPullRequest className="dd-icon" aria-hidden />

interface BadgeConfig {
  intent: IntegrationIntent
  icon: ReactNode
  label: string
  /** Longer wording for the tooltip when the label is terse. */
  hint?: string
}

function getBadgeConfig(data: GitHubPrStatus): BadgeConfig {
  if (data.state === 'merged')
    return {
      intent: 'ok',
      icon: <GitMerge className="dd-icon" aria-hidden />,
      label: 'Merged',
    }
  if (data.state === 'closed')
    return { intent: 'bad', icon: prIcon, label: 'Closed' }
  if (data.draft) return { intent: 'info', icon: prIcon, label: 'Draft' }
  if (data.reviewStatus === 'changes_requested')
    return {
      intent: 'warn',
      icon: <Icon name="edit" />,
      label: 'Changes',
      hint: 'Changes requested',
    }
  if (data.reviewStatus === 'review_requested')
    return { intent: 'info', icon: <Icon name="eye" />, label: 'In review' }
  if (data.reviewStatus === 'approved') {
    const count = data.approvedCount
    const total = data.reviewerCount
    if (count != null && total != null && count < total) {
      return {
        intent: 'info',
        icon: <Icon name="check" />,
        label: `${count}/${total}`,
        hint: `${count} of ${total} approvals`,
      }
    }
    return { intent: 'ok', icon: <Icon name="check" />, label: 'Approved' }
  }
  return { intent: 'info', icon: prIcon, label: 'Open' }
}

/** How far an open PR is behind its base branch: a warn arrow with the count, or a shield when up to date. */
function behindBase(data: GitHubPrStatus) {
  if (data.state !== 'open' || data.behindBy == null) return null
  if (data.behindBy > 0) {
    return {
      text: `${data.behindBy} ${data.behindBy === 1 ? 'commit' : 'commits'} behind base`,
      detail: (
        <span className="dd-badge__count inline-flex items-center gap-0.5">
          <Icon name="arrow-down" className="text-warn" />
          {data.behindBy}
        </span>
      ),
    }
  }
  return {
    text: 'Up to date with base',
    detail: (
      <span className="dd-badge__count">
        <Icon name="shield" className="text-info" />
      </span>
    ),
  }
}

interface GitHubPrBadgeProps {
  url: string
  showTitle?: boolean
  status?: GitHubPrStatus
  isStatusLoading?: boolean
  fetchStatus?: boolean
}

export function GitHubPrBadge({
  url,
  showTitle,
  status,
  isStatusLoading,
  fetchStatus = true,
}: GitHubPrBadgeProps) {
  const statusQuery = useGithubPrStatus(fetchStatus && !status ? url : '')
  const data = status ?? statusQuery.data
  const isLoading = data ? false : (isStatusLoading ?? statusQuery.isLoading)
  const isError = data ? false : fetchStatus ? statusQuery.isError : !isLoading

  // Extract PR number from URL as fallback
  const match = url.match(/\/pull\/(\d+)/)
  const prNumber = data?.number ?? (match ? match[1] : '?')

  if (isLoading) return <IntegrationBadgeLoading reference={prNumber} />

  if (isError || !data) {
    return <IntegrationBadge url={url} reference={prNumber} icon={prIcon} />
  }

  const config = getBadgeConfig(data)
  const behind = behindBase(data)
  const badge = (
    <IntegrationBadge
      url={url}
      reference={data.number}
      icon={config.icon}
      intent={config.intent}
      label={config.label}
      detail={behind?.detail}
      tip={[`${data.title} — ${config.hint ?? config.label}`, behind?.text]
        .filter(Boolean)
        .join(' · ')}
    />
  )

  if (!showTitle) return badge

  return <IntegrationTitleRow badge={badge} title={data.title} />
}
