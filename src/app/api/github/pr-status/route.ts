import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  githubApiFetch,
  parseGithubUrlParam,
  requireGithubToken,
} from '@/lib/github'

const PR_URL_REGEX = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/

export async function GET(request: NextRequest) {
  const parsed = parseGithubUrlParam(
    request.nextUrl.searchParams.get('url'),
    PR_URL_REGEX,
    'Invalid GitHub PR URL',
  )
  if (parsed instanceof NextResponse) {
    return parsed
  }
  const { owner, repo, number } = parsed

  const token = requireGithubToken()
  if (token instanceof NextResponse) {
    return token
  }

  try {
    const res = await githubApiFetch(
      `/repos/${owner}/${repo}/pulls/${number}`,
      token,
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}` },
        { status: res.status === 404 ? 404 : 502 },
      )
    }

    const pr = await res.json()

    let reviewStatus:
      'review_requested' | 'approved' | 'changes_requested' | null = null
    let approvedCount: number | undefined
    let reviewerCount: number | undefined

    if (pr.state === 'open' && !pr.draft) {
      try {
        const reviewsRes = await githubApiFetch(
          `/repos/${owner}/${repo}/pulls/${number}/reviews`,
          token,
        )

        if (reviewsRes.ok) {
          const reviews: Array<{ user: { login: string }; state: string }> =
            await reviewsRes.json()

          // Get latest non-COMMENTED/PENDING review per reviewer
          const latestByReviewer = new Map<string, string>()
          for (const review of reviews) {
            if (review.state !== 'COMMENTED' && review.state !== 'PENDING') {
              latestByReviewer.set(review.user.login, review.state)
            }
          }

          // Count approvals and total reviewers
          const reviewedLogins = new Set(latestByReviewer.keys())
          const pendingLogins = (pr.requested_reviewers ?? [])
            .map((r: { login: string }) => r.login)
            .filter((login: string) => !reviewedLogins.has(login))
          approvedCount = [...latestByReviewer.values()].filter(
            (s) => s === 'APPROVED',
          ).length
          reviewerCount = latestByReviewer.size + pendingLogins.length

          const states = [...latestByReviewer.values()]
          if (states.includes('CHANGES_REQUESTED')) {
            reviewStatus = 'changes_requested'
          } else if (states.includes('APPROVED')) {
            reviewStatus = 'approved'
          } else if (pr.requested_reviewers?.length > 0) {
            reviewStatus = 'review_requested'
          }
        }
      } catch {
        // Silently fall back to reviewStatus: null
      }
    }

    // Check how far behind the base branch this PR is
    let behindBy: number | undefined
    if (pr.state === 'open' && !pr.merged) {
      try {
        const compareRes = await githubApiFetch(
          `/repos/${owner}/${repo}/compare/${pr.head.sha}...${pr.base.label}`,
          token,
        )
        if (compareRes.ok) {
          const compare = await compareRes.json()
          behindBy = compare.ahead_by ?? 0
        }
      } catch {
        // Silently fall back to undefined
      }
    }

    return NextResponse.json({
      state: pr.merged ? 'merged' : pr.state,
      merged: pr.merged ?? false,
      title: pr.title,
      url: pr.html_url,
      number: pr.number,
      author: pr.user?.login ?? '',
      draft: pr.draft ?? false,
      reviewStatus,
      approvedCount,
      reviewerCount,
      behindBy,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch PR status' },
      { status: 502 },
    )
  }
}
