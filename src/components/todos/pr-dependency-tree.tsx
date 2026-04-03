'use client'

import { Check, GitPullRequest, CircleDot, CircleDotDashed } from 'lucide-react'
import { GitHubPrBadge } from './github-pr-badge'
import { GitHubIssueBadge } from './github-issue-badge'
import { AzureWorkItemBadge } from './azure-workitem-badge'
import { useGithubPrStatuses } from '@/hooks/use-github-pr-status'
import { useGithubIssueStatuses } from '@/hooks/use-github-issue-status'
import { useAzureWorkItemStatuses } from '@/hooks/use-azure-workitem-status'

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
  icon: React.ElementType
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
  const { isLoading, allMergedOrClosed, allMerged } =
    useGithubPrStatuses(githubPrUrls)

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
        myPrUrls.map((url) => (
          <div
            key={url}
            className="flex w-full min-w-0 items-center gap-1.5 py-0.5"
          >
            <GitHubPrBadge url={url} showTitle />
          </div>
        ))}

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
            {githubPrUrls.map((url, i) => (
              <div
                key={url}
                className={
                  hasMyPrs
                    ? `pr-tree-branch min-w-0${i === githubPrUrls.length - 1 ? 'pr-tree-branch-last' : ''}`
                    : 'min-w-0 py-0.5'
                }
              >
                <GitHubPrBadge url={url} showTitle />
              </div>
            ))}
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
  const { isLoading, allResolved } = useAzureWorkItemStatuses(azureDepUrls)

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
          <AzureWorkItemBadge url={azureWorkItemUrl} showTitle />
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
            {azureDepUrls.map((url, i) => (
              <div
                key={url}
                className={
                  azureWorkItemUrl
                    ? `pr-tree-branch min-w-0${i === azureDepUrls.length - 1 ? 'pr-tree-branch-last' : ''}`
                    : 'min-w-0 py-0.5'
                }
              >
                <AzureWorkItemBadge url={url} showTitle />
              </div>
            ))}
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
  const { isLoading, allClosed } = useGithubIssueStatuses(githubIssueUrls)

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
        myIssueUrls.map((url) => (
          <div
            key={url}
            className="flex w-full min-w-0 items-center gap-1.5 py-0.5"
          >
            <GitHubIssueBadge url={url} showTitle />
          </div>
        ))}

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
            {githubIssueUrls.map((url, i) => (
              <div
                key={url}
                className={
                  hasMyIssues
                    ? `pr-tree-branch min-w-0${i === githubIssueUrls.length - 1 ? 'pr-tree-branch-last' : ''}`
                    : 'min-w-0 py-0.5'
                }
              >
                <GitHubIssueBadge url={url} showTitle />
              </div>
            ))}
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
