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

    return NextResponse.json({
      state: pr.merged ? 'merged' : pr.state,
      merged: pr.merged ?? false,
      title: pr.title,
      url: pr.html_url,
      number: pr.number,
      author: pr.user?.login ?? '',
      draft: pr.draft ?? false,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch PR status' }, { status: 502 })
  }
}
