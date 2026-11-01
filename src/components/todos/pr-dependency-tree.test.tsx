import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrDependencyTree } from '@/components/todos/pr-dependency-tree'
import { GitHubPrBadge } from '@/components/todos/github-pr-badge'
import type { GitHubPrStatus } from '@/types/todo'

const prStatuses = vi.hoisted(() => new Map<string, GitHubPrStatus>())

vi.mock('@/hooks/use-github-pr-status', () => ({
  useGithubPrStatus: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
  }),
  useGithubPrStatuses: (urls: string[]) => ({
    statuses: urls.map((url) => prStatuses.get(url)),
    isLoading: false,
  }),
}))
vi.mock('@/hooks/use-github-issue-status', () => ({
  useGithubIssueStatus: () => ({ data: undefined, isLoading: false }),
  useGithubIssueStatuses: () => ({ statuses: [], isLoading: false }),
}))
vi.mock('@/hooks/use-azure-workitem-status', () => ({
  useAzureWorkItemStatus: () => ({ data: undefined, isLoading: false }),
  useAzureWorkItemStatuses: () => ({ statuses: [], isLoading: false }),
}))

const REPO = 'https://github.com/acme/app'

function pr(number: number, overrides: Partial<GitHubPrStatus> = {}) {
  const status: GitHubPrStatus = {
    state: 'open',
    merged: false,
    title: `PR ${number}`,
    url: `${REPO}/pull/${number}`,
    number,
    author: 'atn',
    draft: false,
    reviewStatus: null,
    ...overrides,
  }
  prStatuses.set(status.url, status)
  return status
}

beforeEach(() => {
  prStatuses.clear()
})

describe('GitHubPrBadge', () => {
  it.each([
    [{ state: 'merged' as const, merged: true }, 'Merged', 'dd-badge--ok'],
    [{ state: 'closed' as const }, 'Closed', 'dd-badge--bad'],
    [{ draft: true }, 'Draft', 'dd-badge--info'],
    [
      { reviewStatus: 'changes_requested' as const },
      'Changes',
      'dd-badge--warn',
    ],
    [{ reviewStatus: 'approved' as const }, 'Approved', 'dd-badge--ok'],
    [{}, 'Open', 'dd-badge--info'],
  ])('shows %o as %s', (overrides, label, intent) => {
    const status = pr(1, overrides)
    render(
      <GitHubPrBadge url={status.url} status={status} fetchStatus={false} />,
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', status.url)
    expect(link).toHaveClass('dd-badge', intent)
    expect(link).toHaveTextContent(label)
    expect(link).toHaveTextContent('#1')
  })

  it('shows how far an open PR is behind its base', () => {
    const status = pr(2, { behindBy: 3 })
    render(
      <GitHubPrBadge url={status.url} status={status} fetchStatus={false} />,
    )

    expect(screen.getByRole('link')).toHaveTextContent(/Open\s*3\s*#2/)
  })

  it('falls back to a plain link with the number from the URL', () => {
    render(<GitHubPrBadge url={`${REPO}/pull/42`} />)

    const link = screen.getByRole('link')
    expect(link).toHaveClass('dd-badge--neutral')
    expect(link).toHaveTextContent('#42')
  })
})

describe('PrDependencyTree', () => {
  it('draws dependencies as branches under my PRs, the last one closing the tree', () => {
    const mine = pr(1)
    const deps = [pr(2), pr(3)]
    const { container } = render(
      <PrDependencyTree
        myPrUrls={[mine.url]}
        githubPrUrls={deps.map((d) => d.url)}
      />,
    )

    const branches = container.querySelectorAll('.app-pr-tree-branch')
    expect(branches).toHaveLength(2)
    expect(branches[0]).not.toHaveClass('app-pr-tree-branch--last')
    expect(branches[1]).toHaveClass('app-pr-tree-branch--last')
    expect(screen.getByText('Depends on')).toBeInTheDocument()
  })

  it('summarises dependencies once they are all merged', () => {
    const deps = [
      pr(2, { state: 'merged', merged: true }),
      pr(3, { state: 'merged', merged: true }),
    ]
    render(
      <PrDependencyTree myPrUrls={[]} githubPrUrls={deps.map((d) => d.url)} />,
    )

    expect(screen.getByText('PRs merged')).toBeInTheDocument()
  })

  it('shows no resolved summary in the header when there are no dependencies', () => {
    const mine = pr(1)
    render(
      <PrDependencyTree
        myPrUrls={[mine.url]}
        githubPrUrls={[]}
        myIssueUrls={[`${REPO}/issues/5`]}
      />,
    )

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.queryByText('all merged')).not.toBeInTheDocument()
  })

  it('renders nothing without links', () => {
    const { container } = render(
      <PrDependencyTree myPrUrls={[]} githubPrUrls={[]} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
