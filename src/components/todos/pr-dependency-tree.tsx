'use client'

import { Check } from 'lucide-react'
import { GitHubPrBadge, GitHubPrRow } from './github-pr-badge'
import { useGithubPrStatuses } from '@/hooks/use-github-pr-status'

interface PrDependencyTreeProps {
  myPrUrl: string | null | undefined
  githubPrUrls: string[]
}

function PrTree({ myPrUrl, githubPrUrls }: { myPrUrl: string; githubPrUrls: string[] }) {
  const { isLoading, allMergedOrClosed, allMerged } = useGithubPrStatuses(githubPrUrls)

  let label: string
  let labelColor: string

  if (isLoading) {
    label = 'Depends on'
    labelColor = 'var(--text-muted)'
  } else if (allMerged) {
    label = 'Dependencies merged'
    labelColor = '#a371f7'
  } else if (allMergedOrClosed) {
    label = 'Dependencies resolved'
    labelColor = '#a371f7'
  } else {
    label = 'Depends on'
    labelColor = 'var(--text-muted)'
  }

  return (
    <div
      className="pt-1.5"
      style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)' }}
    >
      {/* Root: PR badge with title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <GitHubPrBadge url={myPrUrl} showTitle />
      </div>

      {/* Label */}
      <div className="flex items-center gap-1 mt-0.5" style={{ paddingLeft: 12 }}>
        <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: labelColor }}>
          {allMergedOrClosed && !isLoading && <Check className="h-3 w-3" />}
          {label}
        </span>
      </div>

      {/* Tree branches — each branch draws its own connector */}
      <div>
        {githubPrUrls.map((url, i) => (
          <div
            key={url}
            className={`pr-tree-branch${i === githubPrUrls.length - 1 ? ' pr-tree-branch-last' : ''}`}
          >
            <GitHubPrBadge url={url} showTitle />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PrDependencyTree({ myPrUrl, githubPrUrls }: PrDependencyTreeProps) {
  const hasDeps = githubPrUrls.length > 0

  if (!myPrUrl && !hasDeps) return null

  // Both present — render the tree
  if (myPrUrl && hasDeps) {
    return <PrTree myPrUrl={myPrUrl} githubPrUrls={githubPrUrls} />
  }

  // Only myPr — flat badge
  if (myPrUrl) {
    return (
      <div
        className="pt-1.5"
        style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)' }}
      >
        <GitHubPrBadge url={myPrUrl} showTitle />
      </div>
    )
  }

  // Only deps — reuse existing row behavior
  return <GitHubPrRow urls={githubPrUrls} showTitle />
}
