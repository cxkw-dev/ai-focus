import 'server-only'

import { NextResponse } from 'next/server'

const GITHUB_API_BASE = 'https://api.github.com'
const GITHUB_ACCEPT = 'application/vnd.github.v3+json'

/** Same reasoning as the Azure client: a hung badge lookup must not hold a
 * browser connection slot hostage. See AZURE_REQUEST_TIMEOUT_MS. */
const GITHUB_REQUEST_TIMEOUT_MS = 8_000

export interface GithubUrlParts {
  owner: string
  repo: string
  number: string
}

/**
 * Validates the `?url` query param against a GitHub URL regex. Returns the
 * parsed parts, or a 400 NextResponse mirroring the routes' previous guards:
 * "Missing url parameter" when absent, `invalidMessage` when it doesn't match.
 */
export function parseGithubUrlParam(
  url: string | null,
  regex: RegExp,
  invalidMessage: string,
): GithubUrlParts | NextResponse {
  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 },
    )
  }

  const match = url.match(regex)
  if (!match) {
    return NextResponse.json({ error: invalidMessage }, { status: 400 })
  }

  const [, owner, repo, number] = match
  return { owner, repo, number }
}

/**
 * Reads GITHUB_TOKEN or returns a 500 NextResponse identical to the previous
 * inline guard.
 */
export function requireGithubToken(): string | NextResponse {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured' },
      { status: 500 },
    )
  }
  return token
}

/** Fetches a GitHub REST path with the shared auth headers and no caching. */
export function githubApiFetch(path: string, token: string): Promise<Response> {
  return fetch(`${GITHUB_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: GITHUB_ACCEPT,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(GITHUB_REQUEST_TIMEOUT_MS),
  })
}
