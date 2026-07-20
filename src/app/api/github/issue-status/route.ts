import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  githubApiFetch,
  parseGithubUrlParam,
  requireGithubToken,
} from '@/lib/github'

const ISSUE_URL_REGEX =
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/

export async function GET(request: NextRequest) {
  const parsed = parseGithubUrlParam(
    request.nextUrl.searchParams.get('url'),
    ISSUE_URL_REGEX,
    'Invalid GitHub Issue URL',
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
      `/repos/${owner}/${repo}/issues/${number}`,
      token,
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}` },
        { status: res.status === 404 ? 404 : 502 },
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
      labels: (issue.labels ?? []).map(
        (l: { name: string; color: string }) => ({
          name: l.name,
          color: `#${l.color}`,
        }),
      ),
      assignees: (issue.assignees ?? []).map((a: { login: string }) => a.login),
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch issue status' },
      { status: 502 },
    )
  }
}
