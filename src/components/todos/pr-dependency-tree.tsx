'use client'

import type { ElementType } from 'react'
import { Check, GitPullRequest, CircleDot, CircleDotDashed } from 'lucide-react'
import { GitHubPrBadge } from './github-pr-badge'
import { GitHubIssueBadge } from './github-issue-badge'
import { AzureWorkItemBadge } from './azure-workitem-badge'
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
}

function SectionHeader({
  icon: Icon,
  label,
  statusLabel,
  statusColor,
}: {
  icon: ElementType
  label: string
  statusLabel?: string
  statusColor?: string
}) {
  return (
    <div className="mb-1 flex min-w-0 flex-wrap items-center gap-1.5">
      <Icon
        className="h-3 w-3 flex-shrink-0"
        style={{ color: 'var(--text-muted)', opacity: 0.6 }}
      />
      <span
        className="text-[10px] font-semibold tracking-wide uppercase"
        style={{ color: 'var(--text-muted)', opacity: 0.6 }}
      >
        {label}
      </span>
      {statusLabel && (
        <span
          className="flex min-w-0 items-center gap-1 text-[10px] font-medium"
          style={{ color: statusColor }}
        >
          {statusColor !== 'var(--text-muted)' && (
            <Check className="h-2.5 w-2.5" />
          )}
          {statusLabel}
        </span>
      )}
    </div>
  )
}

function GitHubSection({
  myPrUrls = [],
  githubPrUrls,
  showHeader,
  noBorder,
}: {
  myPrUrls?: string[]
  githubPrUrls: string[]
  showHeader: boolean
  noBorder?: boolean
}) {
  const hasMyPrs = myPrUrls.length > 0
  const hasDeps = githubPrUrls.length > 0
  const allPrUrls = [...myPrUrls, ...githubPrUrls]
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

  let statusLabel: string | undefined
  let statusColor: string | undefined

  if (hasDeps) {
    if (isLoading) {
      statusLabel = undefined
    } else if (allMerged) {
      statusLabel = 'all merged'
      statusColor = '#a371f7'
    } else if (allMergedOrClosed) {
      statusLabel = 'all resolved'
      statusColor = '#a371f7'
    }
  }

  return (
    <div
      className="pt-1.5"
      style={
        noBorder
          ? undefined
          : {
              borderTop:
                '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
            }
      }
    >
      {showHeader && (
        <SectionHeader
          icon={GitPullRequest}
          label="GitHub"
          statusLabel={statusLabel}
          statusColor={statusColor}
        />
      )}

      {/* My PRs */}
      {hasMyPrs &&
        myPrUrls.map((url) => {
          const status = prStatusByUrl.get(url)
          return (
            <div
              key={url}
              className="flex w-full min-w-0 items-center gap-1.5 py-0.5"
            >
              <GitHubPrBadge
                url={url}
                showTitle
                status={status}
                isStatusLoading={isLoadingPrStatuses && !status}
                fetchStatus={false}
              />
            </div>
          )
        })}

      {/* Dependency PRs */}
      {hasDeps && (
        <>
          {hasMyPrs && (
            <div
              className="mt-1.5 flex items-center gap-1"
              style={{ paddingLeft: 12 }}
            >
              <span
                className="text-[10px] font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {allMergedOrClosed && !isLoading
                  ? 'Dependencies resolved'
                  : 'Depends on'}
              </span>
            </div>
          )}
          {!hasMyPrs && !showHeader && (
            <div className="mb-0.5 flex items-center gap-1">
              <span
                className="flex items-center gap-1 text-[10px] font-medium"
                style={{
                  color:
                    allMergedOrClosed && !isLoading
                      ? '#a371f7'
                      : 'var(--text-muted)',
                }}
              >
                {allMergedOrClosed && !isLoading && (
                  <Check className="h-3 w-3" />
                )}
                {allMergedOrClosed && !isLoading
                  ? allMerged
                    ? 'PRs merged'
                    : 'PRs closed'
                  : 'Waiting on'}
              </span>
            </div>
          )}
          <div className={hasMyPrs ? 'mt-0.5' : ''}>
            {githubPrUrls.map((url, i) => {
              const status = prStatusByUrl.get(url)
              return (
                <div
                  key={url}
                  className={
                    hasMyPrs
                      ? `pr-tree-branch min-w-0${i === githubPrUrls.length - 1 ? 'pr-tree-branch-last' : ''}`
                      : 'min-w-0 py-0.5'
                  }
                >
                  <GitHubPrBadge
                    url={url}
                    showTitle
                    status={status}
                    isStatusLoading={isLoadingPrStatuses && !status}
                    fetchStatus={false}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function AzureSection({
  azureWorkItemUrl,
  azureDepUrls,
  showHeader,
  noBorder,
}: {
  azureWorkItemUrl?: string | null
  azureDepUrls: string[]
  showHeader: boolean
  noBorder?: boolean
}) {
  const hasAzureDeps = azureDepUrls.length > 0
  const allAzureUrls = azureWorkItemUrl
    ? [azureWorkItemUrl, ...azureDepUrls]
    : azureDepUrls
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

  let statusLabel: string | undefined
  let statusColor: string | undefined

  if (hasAzureDeps) {
    if (isLoading) {
      statusLabel = undefined
    } else if (allResolved) {
      statusLabel = 'all resolved'
      statusColor = '#3fb950'
    }
  }

  return (
    <div
      className="pt-1.5"
      style={
        noBorder
          ? undefined
          : {
              borderTop:
                '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
            }
      }
    >
      {showHeader && (
        <SectionHeader
          icon={CircleDot}
          label="Azure DevOps"
          statusLabel={statusLabel}
          statusColor={statusColor}
        />
      )}

      {/* My work item */}
      {azureWorkItemUrl && (
        <div className="flex w-full min-w-0 items-center gap-1.5 py-0.5">
          <AzureWorkItemBadge
            url={azureWorkItemUrl}
            showTitle
            status={azureStatusByUrl.get(azureWorkItemUrl)}
            isStatusLoading={
              isLoadingAzureStatuses && !azureStatusByUrl.get(azureWorkItemUrl)
            }
            fetchStatus={false}
          />
        </div>
      )}

      {/* Dependency work items */}
      {hasAzureDeps && (
        <>
          {azureWorkItemUrl && (
            <div
              className="mt-1.5 flex items-center gap-1"
              style={{ paddingLeft: 12 }}
            >
              <span
                className="text-[10px] font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {allResolved && !isLoading
                  ? 'Dependencies resolved'
                  : 'Depends on'}
              </span>
            </div>
          )}
          {!azureWorkItemUrl && !showHeader && (
            <div className="mb-0.5 flex items-center gap-1">
              <span
                className="flex items-center gap-1 text-[10px] font-medium"
                style={{
                  color:
                    allResolved && !isLoading ? '#3fb950' : 'var(--text-muted)',
                }}
              >
                {allResolved && !isLoading && <Check className="h-3 w-3" />}
                {allResolved && !isLoading ? 'All resolved' : 'Waiting on'}
              </span>
            </div>
          )}
          <div className={azureWorkItemUrl ? 'mt-0.5' : ''}>
            {azureDepUrls.map((url, i) => {
              const status = azureStatusByUrl.get(url)
              return (
                <div
                  key={url}
                  className={
                    azureWorkItemUrl
                      ? `pr-tree-branch min-w-0${i === azureDepUrls.length - 1 ? 'pr-tree-branch-last' : ''}`
                      : 'min-w-0 py-0.5'
                  }
                >
                  <AzureWorkItemBadge
                    url={url}
                    showTitle
                    status={status}
                    isStatusLoading={isLoadingAzureStatuses && !status}
                    fetchStatus={false}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function GitHubIssuesSection({
  myIssueUrls = [],
  githubIssueUrls,
  showHeader,
  noBorder,
}: {
  myIssueUrls?: string[]
  githubIssueUrls: string[]
  showHeader: boolean
  noBorder?: boolean
}) {
  const hasMyIssues = myIssueUrls.length > 0
  const hasDeps = githubIssueUrls.length > 0
  const allIssueUrls = [...myIssueUrls, ...githubIssueUrls]
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

  let statusLabel: string | undefined
  let statusColor: string | undefined

  if (hasDeps) {
    if (isLoading) {
      statusLabel = undefined
    } else if (allClosed) {
      statusLabel = 'all closed'
      statusColor = '#a371f7'
    }
  }

  return (
    <div
      className="pt-1.5"
      style={
        noBorder
          ? undefined
          : {
              borderTop:
                '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
            }
      }
    >
      {showHeader && (
        <SectionHeader
          icon={CircleDotDashed}
          label="Issues"
          statusLabel={statusLabel}
          statusColor={statusColor}
        />
      )}

      {/* My Issues */}
      {hasMyIssues &&
        myIssueUrls.map((url) => {
          const status = issueStatusByUrl.get(url)
          return (
            <div
              key={url}
              className="flex w-full min-w-0 items-center gap-1.5 py-0.5"
            >
              <GitHubIssueBadge
                url={url}
                showTitle
                status={status}
                isStatusLoading={isLoadingIssueStatuses && !status}
                fetchStatus={false}
              />
            </div>
          )
        })}

      {/* Dependency Issues */}
      {hasDeps && (
        <>
          {hasMyIssues && (
            <div
              className="mt-1.5 flex items-center gap-1"
              style={{ paddingLeft: 12 }}
            >
              <span
                className="text-[10px] font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {allClosed && !isLoading
                  ? 'Dependencies resolved'
                  : 'Depends on'}
              </span>
            </div>
          )}
          {!hasMyIssues && !showHeader && (
            <div className="mb-0.5 flex items-center gap-1">
              <span
                className="flex items-center gap-1 text-[10px] font-medium"
                style={{
                  color:
                    allClosed && !isLoading ? '#a371f7' : 'var(--text-muted)',
                }}
              >
                {allClosed && !isLoading && <Check className="h-3 w-3" />}
                {allClosed && !isLoading ? 'Issues closed' : 'Waiting on'}
              </span>
            </div>
          )}
          <div className={hasMyIssues ? 'mt-0.5' : ''}>
            {githubIssueUrls.map((url, i) => {
              const status = issueStatusByUrl.get(url)
              return (
                <div
                  key={url}
                  className={
                    hasMyIssues
                      ? `pr-tree-branch min-w-0${i === githubIssueUrls.length - 1 ? 'pr-tree-branch-last' : ''}`
                      : 'min-w-0 py-0.5'
                  }
                >
                  <GitHubIssueBadge
                    url={url}
                    showTitle
                    status={status}
                    isStatusLoading={isLoadingIssueStatuses && !status}
                    fetchStatus={false}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
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
        />
      )}
      {hasGithub && (
        <GitHubSection
          myPrUrls={myPrUrls}
          githubPrUrls={githubPrUrls}
          showHeader={showHeaders}
          noBorder={!hasAzure && noBorder}
        />
      )}
      {hasIssues && (
        <GitHubIssuesSection
          myIssueUrls={myIssueUrls}
          githubIssueUrls={githubIssueUrls}
          showHeader={showHeaders}
          noBorder={!hasAzure && !hasGithub && noBorder}
        />
      )}
    </>
  )
}
