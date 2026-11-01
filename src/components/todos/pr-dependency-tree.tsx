'use client'

import type { ReactNode } from 'react'
import { GitPullRequest } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { GitHubPrBadge } from './github-pr-badge'
import { GitHubIssueBadge } from './github-issue-badge'
import { AzureWorkItemBadge } from './azure-workitem-badge'
import { AzureIcon } from './integration-badge'
import { useGithubPrStatuses } from '@/hooks/use-github-pr-status'
import { useGithubIssueStatuses } from '@/hooks/use-github-issue-status'
import { useAzureWorkItemStatuses } from '@/hooks/use-azure-workitem-status'
import type {
  AzureWorkItemStatus,
  GitHubIssueStatus,
  GitHubPrStatus,
} from '@/types/todo'

const AZURE_RESOLVED_STATES = new Set(['Done', 'Closed', 'Resolved', 'Removed'])

function buildStatusLookup<T>(urls: string[], statuses: Array<T | undefined>) {
  const lookup = new Map<string, T | undefined>()
  urls.forEach((url, index) => {
    lookup.set(url, statuses[index])
  })
  return lookup
}

function getStatusSummary<T>(
  urls: string[],
  lookup: Map<string, T | undefined>,
  isAggregateLoading: boolean,
) {
  const statuses = urls.map((url) => lookup.get(url))
  const loaded = statuses.filter((status): status is T => Boolean(status))

  return {
    loaded,
    isLoading: isAggregateLoading && loaded.length < urls.length,
    allLoaded: loaded.length === urls.length,
  }
}

interface PrDependencyTreeProps {
  myPrUrls: string[]
  githubPrUrls: string[]
  azureWorkItemUrl?: string | null
  azureDepUrls?: string[]
  myIssueUrls?: string[]
  githubIssueUrls?: string[]
  noBorder?: boolean
  /**
   * Whether to poll GitHub/Azure for live state. A finished task's PRs are not
   * going to change, and a Done lane full of them fired dozens of proxied
   * lookups on every visit — enough to saturate the browser's six connections
   * to the app and stall the navigation behind them. Links still render.
   */
  liveStatus?: boolean
}

/** A resolved summary ("all merged"): a quiet ok badge with a check, so it reads without colour. */
function ResolvedBadge({ children }: { children: ReactNode }) {
  return (
    <span className="dd-badge dd-badge--ghost dd-badge--ok">
      <Icon name="check" />
      {children}
    </span>
  )
}

interface TreeItem {
  url: string
  badge: ReactNode
}

interface TreeSectionProps {
  icon: ReactNode
  label: string
  showHeader: boolean
  noBorder?: boolean
  /** The task's own PRs / issues / work item. */
  own: TreeItem[]
  /** What the task waits on; drawn as branches under the own items. */
  deps: TreeItem[]
  /** Every dependency is loaded and finished. */
  resolved: boolean
  /** Header summary once resolved ("all merged"). */
  headerStatus?: string
  /** Summary over a dependency-only list once resolved ("PRs merged"). */
  resolvedLabel: string
}

function TreeSection({
  icon,
  label,
  showHeader,
  noBorder,
  own,
  deps,
  resolved,
  headerStatus,
  resolvedLabel,
}: TreeSectionProps) {
  const hasOwn = own.length > 0

  return (
    <div className={cn('pt-1.5', !noBorder && 'border-border border-t')}>
      {showHeader && (
        <div className="mb-1 flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="dd-eyebrow inline-flex items-center gap-1">
            {icon}
            {label}
          </span>
          {headerStatus && deps.length > 0 && (
            <ResolvedBadge>{headerStatus}</ResolvedBadge>
          )}
        </div>
      )}

      {own.map(({ url, badge }) => (
        <div key={url} className="flex w-full min-w-0 items-center py-0.5">
          {badge}
        </div>
      ))}

      {deps.length > 0 && (
        <>
          {hasOwn ? (
            <p className="text-muted mt-1.5 pl-2.5 text-xs font-medium">
              {resolved ? 'Dependencies resolved' : 'Depends on'}
            </p>
          ) : (
            !showHeader && (
              <div className="mb-0.5 flex">
                {resolved ? (
                  <ResolvedBadge>{resolvedLabel}</ResolvedBadge>
                ) : (
                  <span className="text-muted text-xs font-medium">
                    Waiting on
                  </span>
                )}
              </div>
            )
          )}
          <div className={hasOwn ? 'mt-0.5' : undefined}>
            {deps.map(({ url, badge }, i) => (
              <div
                key={url}
                className={
                  hasOwn
                    ? cn(
                        'app-pr-tree-branch min-w-0',
                        i === deps.length - 1 && 'app-pr-tree-branch--last',
                      )
                    : 'min-w-0 py-0.5'
                }
              >
                {badge}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function GitHubSection({
  myPrUrls = [],
  githubPrUrls,
  showHeader,
  noBorder,
  liveStatus,
}: {
  myPrUrls?: string[]
  githubPrUrls: string[]
  showHeader: boolean
  noBorder?: boolean
  liveStatus: boolean
}) {
  const allPrUrls = liveStatus ? [...myPrUrls, ...githubPrUrls] : []
  const { statuses: prStatuses, isLoading: isLoadingPrStatuses } =
    useGithubPrStatuses(allPrUrls)
  const prStatusByUrl = buildStatusLookup<GitHubPrStatus>(allPrUrls, prStatuses)
  const dependencySummary = getStatusSummary(
    githubPrUrls,
    prStatusByUrl,
    isLoadingPrStatuses,
  )
  const isLoading = dependencySummary.isLoading
  const allMergedOrClosed =
    dependencySummary.allLoaded &&
    dependencySummary.loaded.every(
      (status) => status.state === 'merged' || status.state === 'closed',
    )
  const allMerged =
    dependencySummary.allLoaded &&
    dependencySummary.loaded.every((status) => status.state === 'merged')
  const resolved = allMergedOrClosed && !isLoading

  const toItem = (url: string): TreeItem => {
    const status = prStatusByUrl.get(url)
    return {
      url,
      badge: (
        <GitHubPrBadge
          url={url}
          showTitle
          status={status}
          isStatusLoading={isLoadingPrStatuses && !status}
          fetchStatus={false}
        />
      ),
    }
  }

  return (
    <TreeSection
      icon={<GitPullRequest className="size-[1.15em]" aria-hidden />}
      label="GitHub"
      showHeader={showHeader}
      noBorder={noBorder}
      own={myPrUrls.map(toItem)}
      deps={githubPrUrls.map(toItem)}
      resolved={resolved}
      headerStatus={
        resolved ? (allMerged ? 'all merged' : 'all resolved') : undefined
      }
      resolvedLabel={allMerged ? 'PRs merged' : 'PRs closed'}
    />
  )
}

function AzureSection({
  azureWorkItemUrl,
  azureDepUrls,
  showHeader,
  noBorder,
  liveStatus,
}: {
  azureWorkItemUrl?: string | null
  azureDepUrls: string[]
  showHeader: boolean
  noBorder?: boolean
  liveStatus: boolean
}) {
  const allAzureUrls = liveStatus
    ? azureWorkItemUrl
      ? [azureWorkItemUrl, ...azureDepUrls]
      : azureDepUrls
    : []
  const { statuses: azureStatuses, isLoading: isLoadingAzureStatuses } =
    useAzureWorkItemStatuses(allAzureUrls)
  const azureStatusByUrl = buildStatusLookup<AzureWorkItemStatus>(
    allAzureUrls,
    azureStatuses,
  )
  const dependencySummary = getStatusSummary(
    azureDepUrls,
    azureStatusByUrl,
    isLoadingAzureStatuses,
  )
  const isLoading = dependencySummary.isLoading
  const allResolved =
    dependencySummary.allLoaded &&
    dependencySummary.loaded.every((status) =>
      AZURE_RESOLVED_STATES.has(status.state),
    )
  const resolved = allResolved && !isLoading

  const toItem = (url: string): TreeItem => {
    const status = azureStatusByUrl.get(url)
    return {
      url,
      badge: (
        <AzureWorkItemBadge
          url={url}
          showTitle
          status={status}
          isStatusLoading={isLoadingAzureStatuses && !status}
          fetchStatus={false}
        />
      ),
    }
  }

  return (
    <TreeSection
      icon={<AzureIcon />}
      label="Azure DevOps"
      showHeader={showHeader}
      noBorder={noBorder}
      own={azureWorkItemUrl ? [toItem(azureWorkItemUrl)] : []}
      deps={azureDepUrls.map(toItem)}
      resolved={resolved}
      headerStatus={resolved ? 'all resolved' : undefined}
      resolvedLabel="All resolved"
    />
  )
}

function GitHubIssuesSection({
  myIssueUrls = [],
  githubIssueUrls,
  showHeader,
  noBorder,
  liveStatus,
}: {
  myIssueUrls?: string[]
  githubIssueUrls: string[]
  showHeader: boolean
  noBorder?: boolean
  liveStatus: boolean
}) {
  const allIssueUrls = liveStatus ? [...myIssueUrls, ...githubIssueUrls] : []
  const { statuses: issueStatuses, isLoading: isLoadingIssueStatuses } =
    useGithubIssueStatuses(allIssueUrls)
  const issueStatusByUrl = buildStatusLookup<GitHubIssueStatus>(
    allIssueUrls,
    issueStatuses,
  )
  const dependencySummary = getStatusSummary(
    githubIssueUrls,
    issueStatusByUrl,
    isLoadingIssueStatuses,
  )
  const isLoading = dependencySummary.isLoading
  const allClosed =
    dependencySummary.allLoaded &&
    dependencySummary.loaded.every((status) => status.state === 'closed')
  const resolved = allClosed && !isLoading

  const toItem = (url: string): TreeItem => {
    const status = issueStatusByUrl.get(url)
    return {
      url,
      badge: (
        <GitHubIssueBadge
          url={url}
          showTitle
          status={status}
          isStatusLoading={isLoadingIssueStatuses && !status}
          fetchStatus={false}
        />
      ),
    }
  }

  return (
    <TreeSection
      icon={<Icon name="danger" />}
      label="Issues"
      showHeader={showHeader}
      noBorder={noBorder}
      own={myIssueUrls.map(toItem)}
      deps={githubIssueUrls.map(toItem)}
      resolved={resolved}
      headerStatus={resolved ? 'all closed' : undefined}
      resolvedLabel="Issues closed"
    />
  )
}

export function PrDependencyTree({
  myPrUrls,
  githubPrUrls,
  azureWorkItemUrl,
  azureDepUrls = [],
  myIssueUrls = [],
  githubIssueUrls = [],
  noBorder,
  liveStatus = true,
}: PrDependencyTreeProps) {
  const hasGithub = myPrUrls.length > 0 || githubPrUrls.length > 0
  const hasAzure = !!azureWorkItemUrl || azureDepUrls.length > 0
  const hasIssues = myIssueUrls.length > 0 || githubIssueUrls.length > 0

  if (!hasGithub && !hasAzure && !hasIssues) return null

  // Show section headers when multiple types are present
  const sectionCount = [hasGithub, hasAzure, hasIssues].filter(Boolean).length
  const showHeaders = sectionCount > 1

  return (
    <>
      {hasAzure && (
        <AzureSection
          azureWorkItemUrl={azureWorkItemUrl}
          azureDepUrls={azureDepUrls}
          showHeader={showHeaders}
          noBorder={noBorder}
          liveStatus={liveStatus}
        />
      )}
      {hasGithub && (
        <GitHubSection
          myPrUrls={myPrUrls}
          githubPrUrls={githubPrUrls}
          showHeader={showHeaders}
          noBorder={!hasAzure && noBorder}
          liveStatus={liveStatus}
        />
      )}
      {hasIssues && (
        <GitHubIssuesSection
          myIssueUrls={myIssueUrls}
          githubIssueUrls={githubIssueUrls}
          showHeader={showHeaders}
          noBorder={!hasAzure && !hasGithub && noBorder}
          liveStatus={liveStatus}
        />
      )}
    </>
  )
}
