import { NextRequest, NextResponse } from 'next/server'

const PR_URL_REGEX = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  const match = url.match(PR_URL_REGEX)
  if (!match) {
    return NextResponse.json({ error: 'Invalid GitHub PR URL' }, { status: 400 })
  }

  const [, owner, repo, number] = match
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}` },
        { status: res.status === 404 ? 404 : 502 }
      )
    }

    const pr = await res.json()

    let reviewStatus: 'review_requested' | 'approved' | 'changes_requested' | null = null

    if (pr.state === 'open' && !pr.draft) {
      try {
        const reviewsRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/reviews`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
            cache: 'no-store',
          }
        )

        if (reviewsRes.ok) {
          const reviews: Array<{ user: { login: string }; state: string }> = await reviewsRes.json()

          // Get latest non-COMMENTED/PENDING review per reviewer
          const latestByReviewer = new Map<string, string>()
          for (const review of reviews) {
            if (review.state !== 'COMMENTED' && review.state !== 'PENDING') {
              latestByReviewer.set(review.user.login, review.state)
            }
          }

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

    return NextResponse.json({
      state: pr.merged ? 'merged' : pr.state,
      merged: pr.merged ?? false,
      title: pr.title,
      url: pr.html_url,
      number: pr.number,
      author: pr.user?.login ?? '',
      draft: pr.draft ?? false,
      reviewStatus,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch PR status' }, { status: 502 })
  }
}
