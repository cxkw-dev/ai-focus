import { NextRequest, NextResponse } from 'next/server'
import {
  AzureCommitRef,
  AzureDevOpsError,
  AzurePullRequestRef,
  fetchAzureJson,
  fetchWorkItem,
  fetchWorkItemSummaries,
  getAzureDevOpsConfig,
  getCommentsApiVersion,
  getWorkItemTeamProject,
  parseCommitRef,
  parsePullRequestRef,
  parseWorkItemId,
  splitTags,
  toIdentity,
  toText,
  extractWorkItemIdFromRelationUrl,
} from '@/lib/azure-devops'

interface AzureComment {
  id: number
  text?: string
  renderedText?: string
  createdDate?: string
  modifiedDate?: string
  createdBy?: unknown
}

interface AzureFieldUpdate {
  oldValue?: unknown
  newValue?: unknown
}

interface AzureWorkItemUpdate {
  id: number
  rev?: number
  revisedDate?: string
  revisedBy?: unknown
  fields?: Record<string, AzureFieldUpdate>
}

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

interface RelationEntry {
  id: number
  relation: string
  url: string
  name: string | null
  comment: string | null
}

interface ContextSectionError {
  _error: true
  message: string
  status?: number
  details?: unknown
}

const DEFAULT_MAX_COMMENTS = 20
const DEFAULT_MAX_UPDATES = 20
const MAX_SECTION_ITEMS = 100

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const workItemId = parseWorkItemId(id)
    const config = getAzureDevOpsConfig()

    const includeComments = parseBooleanFlag(
      request.nextUrl.searchParams.get('includeComments'),
      true,
    )
    const includeUpdates = parseBooleanFlag(
      request.nextUrl.searchParams.get('includeUpdates'),
      false,
    )
    const maxComments = parseListLimit(
      request.nextUrl.searchParams.get('maxComments'),
      DEFAULT_MAX_COMMENTS,
    )
    const maxUpdates = parseListLimit(
      request.nextUrl.searchParams.get('maxUpdates'),
      DEFAULT_MAX_UPDATES,
    )

    // Single canonical work item fetch reused across all sections.
    const workItem = await fetchWorkItem(config, workItemId, {
      expandRelations: true,
    })
    const teamProject = getWorkItemTeamProject(workItem)

    const [relations, prLinks, comments, updates] = await Promise.all([
      safeSection(
        () =>
          buildRelationsPayload(config, workItemId, workItem.relations ?? []),
        'Failed to fetch work item relations',
      ),
      safeSection(
        () =>
          buildPrLinksPayload(
            config,
            workItemId,
            workItem.relations ?? [],
            teamProject,
          ),
        'Failed to fetch work item PR links',
      ),
      includeComments
        ? safeSection(
            () =>
              buildCommentsPayload(
                config,
                workItemId,
                teamProject,
                maxComments,
              ),
            'Failed to fetch work item comments',
          )
        : Promise.resolve({ skipped: true as const }),
      includeUpdates
        ? safeSection(
            () => buildUpdatesPayload(config, workItemId, maxUpdates),
            'Failed to fetch work item updates',
          )
        : Promise.resolve({ skipped: true as const }),
    ])

    const fields = workItem.fields ?? {}

    const systemLinks = Object.entries(workItem._links ?? {})
      .map(([type, value]) => {
        const href = typeof value?.href === 'string' ? value.href : null
        return href ? { type, url: href } : null
      })
      .filter((value): value is { type: string; url: string } => value !== null)

    const relationLinks = (workItem.relations ?? [])
      .map((relation) => {
        if (!relation.url) return null
        return {
          relation: relation.rel ?? 'unknown',
          name: toText(relation.attributes?.name),
          comment: toText(relation.attributes?.comment),
          url: relation.url,
        }
      })
      .filter(
        (
          value,
        ): value is {
          relation: string
          name: string | null
          comment: string | null
          url: string
        } => value !== null,
      )

    return NextResponse.json({
      workItemId,
      workItem: {
        id: workItem.id,
        title: toText(fields['System.Title']) ?? '',
        state: toText(fields['System.State']) ?? '',
        assignee: toIdentity(fields['System.AssignedTo']),
        areaPath: toText(fields['System.AreaPath']),
        iterationPath: toText(fields['System.IterationPath']),
        description: toText(fields['System.Description']),
        acceptanceCriteria: toText(
          fields['Microsoft.VSTS.Common.AcceptanceCriteria'],
        ),
        tags: splitTags(fields['System.Tags']),
        links: {
          system: systemLinks,
          relations: relationLinks,
        },
      },
      relations,
      prLinks,
      comments,
      updates,
      meta: {
        optimized: true,
        includeComments,
        includeUpdates,
        maxComments,
        maxUpdates,
      },
    })
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      )
    }

    console.error('Error fetching Azure work item context:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Azure work item context' },
      { status: 502 },
    )
  }
}

async function buildRelationsPayload(
  config: ReturnType<typeof getAzureDevOpsConfig>,
  workItemId: number,
  relations: Array<{
    rel?: string
    url?: string
    attributes?: Record<string, unknown>
  }>,
) {
  const parents: RelationEntry[] = []
  const children: RelationEntry[] = []
  const dependsOn: RelationEntry[] = []
  const related: RelationEntry[] = []

  for (const relation of relations) {
    if (!relation.url) continue

    const linkedId = extractWorkItemIdFromRelationUrl(relation.url)
    if (!linkedId) continue

    const entry: RelationEntry = {
      id: linkedId,
      relation: relation.rel ?? 'unknown',
      url: relation.url,
      name: toText(relation.attributes?.name),
      comment: toText(relation.attributes?.comment),
    }

    switch (relation.rel) {
      case 'System.LinkTypes.Hierarchy-Reverse':
        parents.push(entry)
        break
      case 'System.LinkTypes.Hierarchy-Forward':
        children.push(entry)
        break
      case 'System.LinkTypes.Dependency-Reverse':
        dependsOn.push(entry)
        break
      case 'System.LinkTypes.Related':
      case 'System.LinkTypes.Dependency-Forward':
        related.push(entry)
        break
      default:
        break
    }
  }

  const allLinkedIds = Array.from(
    new Set(
      [...parents, ...children, ...dependsOn, ...related].map(
        (entry) => entry.id,
      ),
    ),
  )
  const summaryById = await fetchWorkItemSummaries(config, allLinkedIds)

  const withSummary = (entries: RelationEntry[]) =>
    entries.map((entry) => {
      const summary = summaryById.get(entry.id)
      return {
        ...entry,
        title: summary?.title ?? null,
        state: summary?.state ?? null,
      }
    })

  const parentEntries = withSummary(parents)
  const childEntries = withSummary(children)
  const dependsOnEntries = withSummary(dependsOn)
  const relatedEntries = withSummary(related)

  return {
    workItemId,
    parent: parentEntries[0] ?? null,
    parents: parentEntries,
    children: childEntries,
    dependsOn: dependsOnEntries,
    related: relatedEntries,
  }
}

async function buildPrLinksPayload(
  config: ReturnType<typeof getAzureDevOpsConfig>,
  workItemId: number,
  relations: Array<{ url?: string }>,
  teamProject: string | null,
) {
  const pullRequestRefs: AzurePullRequestRef[] = []
  const commitRefs: AzureCommitRef[] = []

  for (const relation of relations) {
    const prRef = parsePullRequestRef(relation.url)
    if (prRef) pullRequestRefs.push(prRef)

    const commitRef = parseCommitRef(relation.url)
    if (commitRef) commitRefs.push(commitRef)
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

  return {
    workItemId,
    pullRequests,
    commits,
  }
}

async function buildCommentsPayload(
  config: ReturnType<typeof getAzureDevOpsConfig>,
  workItemId: number,
  teamProject: string | null,
  maxComments: number,
) {
  if (!teamProject) {
    throw new AzureDevOpsError(
      'Could not determine Team Project for this work item',
      502,
    )
  }

  const response = await fetchAzureJson<{ comments?: AzureComment[] }>(
    config,
    `/${encodeURIComponent(teamProject)}/_apis/wit/workitems/${workItemId}/comments`,
    {
      apiVersion: getCommentsApiVersion(),
    },
  )

  const comments = (response.comments ?? [])
    .map((comment) => ({
      id: comment.id,
      text: toText(comment.text) ?? toText(comment.renderedText) ?? '',
      createdAt: comment.createdDate ?? null,
      updatedAt: comment.modifiedDate ?? null,
      author: toIdentity(comment.createdBy),
    }))
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return aTime - bTime
    })

  const limited = comments.slice(0, maxComments)

  return {
    workItemId,
    count: comments.length,
    returned: limited.length,
    comments: limited,
  }
}

async function buildUpdatesPayload(
  config: ReturnType<typeof getAzureDevOpsConfig>,
  workItemId: number,
  maxUpdates: number,
) {
  const response = await fetchAzureJson<{ value?: AzureWorkItemUpdate[] }>(
    config,
    `/_apis/wit/workitems/${workItemId}/updates`,
    {
      searchParams: { $top: 50 },
    },
  )

  const updates = (response.value ?? [])
    .map((update) => {
      const changes = Object.entries(update.fields ?? {})
        .map(([field, value]) => ({
          field,
          oldValue: normalizeFieldValue(value?.oldValue),
          newValue: normalizeFieldValue(value?.newValue),
        }))
        .filter(
          (change) => change.oldValue !== null || change.newValue !== null,
        )

      if (changes.length === 0) return null

      const stateChange = changes.find(
        (change) => change.field === 'System.State',
      )

      return {
        updateId: update.id,
        revision: update.rev ?? null,
        changedAt: update.revisedDate ?? null,
        changedBy: toIdentity(update.revisedBy),
        stateChange: stateChange
          ? { from: stateChange.oldValue, to: stateChange.newValue }
          : null,
        changes,
      }
    })
    .filter((update): update is NonNullable<typeof update> => update !== null)
    .sort((a, b) => {
      const aTime = a.changedAt ? new Date(a.changedAt).getTime() : 0
      const bTime = b.changedAt ? new Date(b.changedAt).getTime() : 0
      return bTime - aTime
    })

  const limited = updates.slice(0, maxUpdates)

  return {
    workItemId,
    count: updates.length,
    returned: limited.length,
    updates: limited,
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

function normalizeFieldValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  const identity = toIdentity(value)
  if (identity?.displayName) return identity.displayName
  if (identity?.uniqueName) return identity.uniqueName

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    const preferred =
      toText(objectValue.name) ??
      toText(objectValue.title) ??
      toText(objectValue.value)
    if (preferred) return preferred
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function parseBooleanFlag(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback
  const normalized = value.trim().toLowerCase()
  if (normalized === '') return fallback
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  return fallback
}

function parseListLimit(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, MAX_SECTION_ITEMS)
}

async function safeSection<T>(
  loader: () => Promise<T>,
  fallbackMessage: string,
): Promise<T | ContextSectionError> {
  try {
    return await loader()
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      return {
        _error: true,
        message: error.message,
        status: error.status,
        details: error.details,
      }
    }

    return {
      _error: true,
      message: fallbackMessage,
      details: error instanceof Error ? error.message : String(error),
    }
  }
}
