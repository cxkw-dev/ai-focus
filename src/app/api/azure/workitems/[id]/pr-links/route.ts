import { NextResponse } from 'next/server'
import {
  AzureCommitRef,
  AzureDevOpsError,
  AzurePullRequestRef,
  fetchAzureJson,
  fetchWorkItem,
  getAzureDevOpsConfig,
  getWorkItemTeamProject,
  parseCommitRef,
  parsePullRequestRef,
  parseWorkItemId,
  toIdentity,
} from '@/lib/azure-devops'

interface AzurePullRequestResponse {
  pullRequestId?: number
  title?: string
  status?: string
  isDraft?: boolean
  sourceRefName?: string
  targetRefName?: string
  createdBy?: unknown
  repository?: {
    id?: string
    name?: string
  }
  url?: string
  creationDate?: string
  closedDate?: string
}

interface AzureCommitResponse {
  commitId?: string
  comment?: string
  author?: {
    name?: string
    email?: string
    date?: string
  }
  url?: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const workItemId = parseWorkItemId(id)
    const config = getAzureDevOpsConfig()
    const workItem = await fetchWorkItem(config, workItemId, {
      expandRelations: true,
    })
    const teamProject = getWorkItemTeamProject(workItem)

    const pullRequestRefs: AzurePullRequestRef[] = []
    const commitRefs: AzureCommitRef[] = []

    for (const relation of workItem.relations ?? []) {
      const prRef = parsePullRequestRef(relation.url)
      if (prRef) {
        pullRequestRefs.push(prRef)
      }

      const commitRef = parseCommitRef(relation.url)
      if (commitRef) {
        commitRefs.push(commitRef)
      }
    }

    const uniquePullRequestRefs = dedupeBy(
      pullRequestRefs,
      (ref) => `${ref.repoId}:${ref.pullRequestId}`,
    )
    const uniqueCommitRefs = dedupeBy(
      commitRefs,
      (ref) => `${ref.repoId}:${ref.commitId}`,
    )

    const pullRequests = await Promise.all(
      uniquePullRequestRefs.map((ref) =>
        resolvePullRequest(config, ref, teamProject),
      ),
    )

    const commits = await Promise.all(
      uniqueCommitRefs.map((ref) => resolveCommit(config, ref, teamProject)),
    )

    return NextResponse.json({
      workItemId,
      pullRequests,
      commits,
    })
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      )
    }

    console.error('Error fetching Azure PR links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Azure PR links' },
      { status: 502 },
    )
  }
}

async function resolvePullRequest(
  config: ReturnType<typeof getAzureDevOpsConfig>,
  ref: AzurePullRequestRef,
  teamProject: string | null,
) {
  try {
    const detail = await fetchPullRequestDetail(config, ref, teamProject)
    const status = detail.status ?? null

    return {
      id: detail.pullRequestId ?? ref.pullRequestId,
      title: detail.title ?? null,
      state: status,
      mergeStatus: toMergeStatus(status),
      merged: status === 'completed',
      draft: detail.isDraft ?? false,
      repository: {
        id: detail.repository?.id ?? ref.repoId,
        name: detail.repository?.name ?? null,
      },
      sourceRef: detail.sourceRefName ?? null,
      targetRef: detail.targetRefName ?? null,
      createdAt: detail.creationDate ?? null,
      closedAt: detail.closedDate ?? null,
      author: toIdentity(detail.createdBy),
      url: detail.url ?? ref.relationUrl,
    }
  } catch (error) {
    return {
      id: ref.pullRequestId,
      title: null,
      state: null,
      mergeStatus: 'unknown',
      merged: false,
      draft: false,
      repository: { id: ref.repoId, name: null },
      sourceRef: null,
      targetRef: null,
      createdAt: null,
      closedAt: null,
      author: null,
      url: ref.relationUrl,
      error:
        error instanceof Error ? error.message : 'Failed to resolve PR details',
    }
  }
}

async function resolveCommit(
  config: ReturnType<typeof getAzureDevOpsConfig>,
  ref: AzureCommitRef,
  teamProject: string | null,
) {
  try {
    const detail = await fetchCommitDetail(config, ref, teamProject)

    return {
      id: detail.commitId ?? ref.commitId,
      message: detail.comment ?? null,
      repository: { id: ref.repoId },
      author: {
        name: detail.author?.name ?? null,
        email: detail.author?.email ?? null,
      },
      authoredAt: detail.author?.date ?? null,
      url: detail.url ?? ref.relationUrl,
    }
  } catch (error) {
    return {
      id: ref.commitId,
      message: null,
      repository: { id: ref.repoId },
      author: {
        name: null,
        email: null,
      },
      authoredAt: null,
      url: ref.relationUrl,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to resolve commit details',
    }
  }
}

async function fetchPullRequestDetail(
  config: ReturnType<typeof getAzureDevOpsConfig>,
  ref: AzurePullRequestRef,
  teamProject: string | null,
): Promise<AzurePullRequestResponse> {
  if (ref.source === 'relation-url' && /^https?:\/\//i.test(ref.relationUrl)) {
    return fetchAzureJson<AzurePullRequestResponse>(config, ref.relationUrl)
  }

  if (!teamProject) {
    throw new AzureDevOpsError('Missing Team Project for PR resolution', 502)
  }

  return fetchAzureJson<AzurePullRequestResponse>(
    config,
    `/${encodeURIComponent(teamProject)}/_apis/git/repositories/${encodeURIComponent(ref.repoId)}/pullRequests/${ref.pullRequestId}`,
  )
}

async function fetchCommitDetail(
  config: ReturnType<typeof getAzureDevOpsConfig>,
  ref: AzureCommitRef,
  teamProject: string | null,
): Promise<AzureCommitResponse> {
  if (ref.source === 'relation-url' && /^https?:\/\//i.test(ref.relationUrl)) {
    return fetchAzureJson<AzureCommitResponse>(config, ref.relationUrl)
  }

  if (!teamProject) {
    throw new AzureDevOpsError(
      'Missing Team Project for commit resolution',
      502,
    )
  }

  return fetchAzureJson<AzureCommitResponse>(
    config,
    `/${encodeURIComponent(teamProject)}/_apis/git/repositories/${encodeURIComponent(ref.repoId)}/commits/${encodeURIComponent(ref.commitId)}`,
  )
}

function toMergeStatus(
  status: string | null,
): 'merged' | 'open' | 'abandoned' | 'unknown' {
  if (status === 'completed') return 'merged'
  if (status === 'active') return 'open'
  if (status === 'abandoned') return 'abandoned'
  return 'unknown'
}

function dedupeBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>()
  const deduped: T[] = []

  for (const item of items) {
    const key = keyFn(item)
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(item)
  }

  return deduped
}
