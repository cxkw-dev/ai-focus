import { NextRequest, NextResponse } from 'next/server'

const WORKITEM_URL_REGEX =
  /^https?:\/\/dev\.azure\.com\/([^/]+)\/([^/]+)\/_workitems\/edit\/(\d+)/

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 },
    )
  }

  const match = url.match(WORKITEM_URL_REGEX)
  if (!match) {
    return NextResponse.json(
      { error: 'Invalid Azure DevOps work item URL' },
      { status: 400 },
    )
  }

  const [, org, project, id] = match
  const pat = process.env.AZURE_DEVOPS

  if (!pat) {
    return NextResponse.json(
      { error: 'AZURE_DEVOPS PAT not configured' },
      { status: 500 },
    )
  }

  try {
    const decodedProject = decodeURIComponent(project)
    const authHeader = `Basic ${Buffer.from(`:${pat}`).toString('base64')}`

    const res = await fetch(
      `https://dev.azure.com/${org}/${encodeURIComponent(decodedProject)}/_apis/wit/workitems/${id}?$expand=relations&api-version=7.1`,
      {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `Azure DevOps API error: ${res.status}` },
        { status: res.status === 404 ? 404 : 502 },
      )
    }

    const item = await res.json()
    const fields = item.fields ?? {}

    // Extract linked PRs, commits, and branches from relations
    interface Relation {
      rel: string
      url: string
      attributes?: { name?: string; comment?: string }
    }
    const relations: Relation[] = item.relations ?? []

    const linkedPrs: { name: string; url: string }[] = []
    const linkedBranches: { name: string; url: string }[] = []
    const linkedCommits: { name: string; url: string }[] = []

    for (const rel of relations) {
      const relUrl = rel.url ?? ''
      const name = rel.attributes?.name ?? ''

      if (
        relUrl.includes('/git/repositories/') &&
        relUrl.includes('/pullRequests/')
      ) {
        linkedPrs.push({ name: name || 'Pull Request', url: relUrl })
      } else if (
        relUrl.includes('/git/repositories/') &&
        relUrl.includes('/refs/')
      ) {
        linkedBranches.push({ name: name || 'Branch', url: relUrl })
      } else if (
        relUrl.includes('/git/repositories/') &&
        relUrl.includes('/commits/')
      ) {
        linkedCommits.push({ name: name || 'Commit', url: relUrl })
      } else if (rel.rel === 'ArtifactLink' || relUrl.includes('vstfs:///')) {
        // Artifact links for PRs, branches, commits use vstfs:/// URIs
        const comment = rel.attributes?.comment ?? ''
        if (
          relUrl.includes('PullRequestId') ||
          comment.toLowerCase().includes('pull request')
        ) {
          linkedPrs.push({
            name: comment || name || 'Pull Request',
            url: relUrl,
          })
        } else if (
          relUrl.includes('Ref') ||
          comment.toLowerCase().includes('branch')
        ) {
          linkedBranches.push({
            name: comment || name || 'Branch',
            url: relUrl,
          })
        } else if (
          relUrl.includes('Commit') ||
          comment.toLowerCase().includes('commit')
        ) {
          linkedCommits.push({ name: comment || name || 'Commit', url: relUrl })
        }
      }
    }

    return NextResponse.json({
      id: item.id,
      title: fields['System.Title'] ?? '',
      state: fields['System.State'] ?? '',
      type: fields['System.WorkItemType'] ?? '',
      url,
      assignedTo: fields['System.AssignedTo']?.displayName ?? null,
      linkedPrs,
      linkedBranches,
      linkedCommits,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch work item status' },
      { status: 502 },
    )
  }
}
