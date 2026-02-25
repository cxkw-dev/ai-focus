'use client'

import { Check, GitPullRequest, CircleDot } from 'lucide-react'
import { GitHubPrBadge } from './github-pr-badge'
import { AzureWorkItemBadge } from './azure-workitem-badge'
import { useGithubPrStatuses } from '@/hooks/use-github-pr-status'
import { useAzureWorkItemStatuses } from '@/hooks/use-azure-workitem-status'

interface PrDependencyTreeProps {
  myPrUrl: string | null | undefined
  githubPrUrls: string[]
  azureWorkItemUrl?: string | null
  azureDepUrls?: string[]
  noBorder?: boolean
}

function SectionHeader({ icon: Icon, label, statusLabel, statusColor }: {
  icon: React.ElementType
  label: string
  statusLabel?: string
  statusColor?: string
}) {
  return (
    <div className="mb-1 flex min-w-0 flex-wrap items-center gap-1.5">
      <Icon className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        {label}
      </span>
      {statusLabel && (
        <span className="flex min-w-0 items-center gap-1 text-[10px] font-medium" style={{ color: statusColor }}>
          {statusColor !== 'var(--text-muted)' && <Check className="h-2.5 w-2.5" />}
          {statusLabel}
        </span>
      )}
    </div>
  )
}

function GitHubSection({ myPrUrl, githubPrUrls, showHeader, noBorder }: { myPrUrl?: string | null; githubPrUrls: string[]; showHeader: boolean; noBorder?: boolean }) {
  const hasDeps = githubPrUrls.length > 0
  const { isLoading, allMergedOrClosed, allMerged } = useGithubPrStatuses(githubPrUrls)

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
      style={noBorder ? undefined : { borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)' }}
    >
      {showHeader && (
        <SectionHeader icon={GitPullRequest} label="GitHub" statusLabel={statusLabel} statusColor={statusColor} />
      )}

      {/* My PR */}
      {myPrUrl && (
        <div className="flex w-full min-w-0 items-center gap-1.5">
          <GitHubPrBadge url={myPrUrl} showTitle />
        </div>
      )}

      {/* Dependency PRs */}
      {hasDeps && (
        <>
          {myPrUrl && (
            <div className="flex items-center gap-1 mt-1.5" style={{ paddingLeft: 12 }}>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {allMergedOrClosed && !isLoading ? 'Dependencies resolved' : 'Depends on'}
              </span>
            </div>
          )}
          {!myPrUrl && !showHeader && (
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: allMergedOrClosed && !isLoading ? '#a371f7' : 'var(--text-muted)' }}>
                {allMergedOrClosed && !isLoading && <Check className="h-3 w-3" />}
                {allMergedOrClosed && !isLoading ? (allMerged ? 'PRs merged' : 'PRs closed') : 'Waiting on'}
              </span>
            </div>
          )}
          <div className={myPrUrl ? 'mt-0.5' : ''}>
            {githubPrUrls.map((url, i) => (
              <div
                key={url}
                className={myPrUrl ? `pr-tree-branch min-w-0${i === githubPrUrls.length - 1 ? ' pr-tree-branch-last' : ''}` : 'min-w-0 py-0.5'}
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

function AzureSection({ azureWorkItemUrl, azureDepUrls, showHeader, noBorder }: { azureWorkItemUrl?: string | null; azureDepUrls: string[]; showHeader: boolean; noBorder?: boolean }) {
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
      style={noBorder ? undefined : { borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)' }}
    >
      {showHeader && (
        <SectionHeader icon={CircleDot} label="Azure DevOps" statusLabel={statusLabel} statusColor={statusColor} />
      )}

      {/* My work item */}
      {azureWorkItemUrl && (
        <div className="flex w-full min-w-0 items-center gap-1.5">
          <AzureWorkItemBadge url={azureWorkItemUrl} showTitle />
        </div>
      )}

      {/* Dependency work items */}
      {hasAzureDeps && (
        <>
          {azureWorkItemUrl && (
            <div className="flex items-center gap-1 mt-1.5" style={{ paddingLeft: 12 }}>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {allResolved && !isLoading ? 'Dependencies resolved' : 'Depends on'}
              </span>
            </div>
          )}
          {!azureWorkItemUrl && !showHeader && (
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: allResolved && !isLoading ? '#3fb950' : 'var(--text-muted)' }}>
                {allResolved && !isLoading && <Check className="h-3 w-3" />}
                {allResolved && !isLoading ? 'All resolved' : 'Waiting on'}
              </span>
            </div>
          )}
          <div className={azureWorkItemUrl ? 'mt-0.5' : ''}>
            {azureDepUrls.map((url, i) => (
              <div
                key={url}
                className={azureWorkItemUrl ? `pr-tree-branch min-w-0${i === azureDepUrls.length - 1 ? ' pr-tree-branch-last' : ''}` : 'min-w-0 py-0.5'}
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

export function PrDependencyTree({ myPrUrl, githubPrUrls, azureWorkItemUrl, azureDepUrls = [], noBorder }: PrDependencyTreeProps) {
  const hasGithub = !!myPrUrl || githubPrUrls.length > 0
  const hasAzure = !!azureWorkItemUrl || azureDepUrls.length > 0

  if (!hasGithub && !hasAzure) return null

  // Show section headers when both types are present
  const showHeaders = hasGithub && hasAzure

  return (
    <>
      {hasAzure && (
        <AzureSection azureWorkItemUrl={azureWorkItemUrl} azureDepUrls={azureDepUrls} showHeader={showHeaders} noBorder={noBorder} />
      )}
      {hasGithub && (
        <GitHubSection myPrUrl={myPrUrl} githubPrUrls={githubPrUrls} showHeader={showHeaders} noBorder={!hasAzure && noBorder} />
      )}
    </>
  )
}
