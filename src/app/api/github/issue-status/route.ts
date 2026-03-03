import { NextRequest, NextResponse } from 'next/server'

const ISSUE_URL_REGEX = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  const match = url.match(ISSUE_URL_REGEX)
  if (!match) {
    return NextResponse.json({ error: 'Invalid GitHub Issue URL' }, { status: 400 })
  }

  const [, owner, repo, number] = match
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${number}`,
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

    const issue = await res.json()

    return NextResponse.json({
      state: issue.state,
      stateReason: issue.state_reason ?? null,
      title: issue.title,
      url: issue.html_url,
      number: issue.number,
      author: issue.user?.login ?? '',
      labels: (issue.labels ?? []).map((l: { name: string; color: string }) => ({
        name: l.name,
        color: `#${l.color}`,
      })),
      assignees: (issue.assignees ?? []).map((a: { login: string }) => a.login),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch issue status' }, { status: 502 })
  }
}
