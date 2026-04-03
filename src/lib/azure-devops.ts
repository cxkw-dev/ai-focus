const DEFAULT_AZURE_API_VERSION = '7.1'
const COMMENTS_AZURE_API_VERSION = '7.1-preview.4'

export interface AzureDevOpsConfig {
  org: string
  pat: string
}

export interface AzureIdentity {
  id: string | null
  displayName: string | null
  uniqueName: string | null
}

export interface AzureWorkItemRelation {
  rel?: string
  url?: string
  attributes?: Record<string, unknown>
}

export interface AzureWorkItem {
  id: number
  fields?: Record<string, unknown>
  relations?: AzureWorkItemRelation[]
  _links?: Record<string, { href?: string }>
}

export interface AzureWorkItemSummary {
  id: number
  title: string | null
  state: string | null
  type: string | null
  url: string | null
}

export interface AzurePullRequestRef {
  repoId: string
  pullRequestId: number
  source: 'relation-url' | 'artifact'
  relationUrl: string
}

export interface AzureCommitRef {
  repoId: string
  commitId: string
  source: 'relation-url' | 'artifact'
  relationUrl: string
}

interface AzureFetchOptions {
  apiVersion?: string
  searchParams?: Record<string, string | number | undefined>
}

export class AzureDevOpsError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status = 502, details?: unknown) {
    super(message)
    this.name = 'AzureDevOpsError'
    this.status = status
    this.details = details
  }
}

export function getAzureDevOpsConfig(orgOverride?: string): AzureDevOpsConfig {
  const pat = process.env.AZURE_DEVOPS
  if (!pat) {
    throw new AzureDevOpsError('AZURE_DEVOPS PAT not configured', 500)
  }

  const org = orgOverride ?? process.env.AZURE_DEVOPS_ORG
  if (!org) {
    throw new AzureDevOpsError(
      'AZURE_DEVOPS_ORG not configured (required for workItemId-based Azure MCP tools)',
      500,
    )
  }

  return { org, pat }
}

export function parseWorkItemId(value: string): number {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) {
    throw new AzureDevOpsError('Invalid work item ID', 400)
  }

  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AzureDevOpsError('Invalid work item ID', 400)
  }
  return parsed
}

export async function fetchAzureJson<T>(
  config: AzureDevOpsConfig,
  pathOrUrl: string,
  options?: AzureFetchOptions,
): Promise<T> {
  const url = buildAzureUrl(config.org, pathOrUrl)

  if (!url.searchParams.has('api-version')) {
    url.searchParams.set(
      'api-version',
      options?.apiVersion ?? DEFAULT_AZURE_API_VERSION,
    )
  }

  const searchParams = options?.searchParams ?? {}
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }

  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${Buffer.from(`:${config.pat}`).toString('base64')}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })
  } catch (error) {
    throw new AzureDevOpsError(
      'Failed to connect to Azure DevOps API',
      502,
      String(error),
    )
  }

  if (!response.ok) {
    const body = await response.text()
    throw new AzureDevOpsError(
      `Azure DevOps API error: ${response.status}`,
      mapAzureStatus(response.status),
      body,
    )
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    throw new AzureDevOpsError(
      'Azure DevOps API returned invalid JSON',
      502,
      String(error),
    )
  }
}

export async function fetchWorkItem(
  config: AzureDevOpsConfig,
  workItemId: number,
  options?: { fields?: string[]; expandRelations?: boolean },
): Promise<AzureWorkItem> {
  return fetchAzureJson<AzureWorkItem>(
    config,
    `/_apis/wit/workitems/${workItemId}`,
    {
      searchParams: {
        fields: options?.fields?.length ? options.fields.join(',') : undefined,
        $expand: options?.expandRelations ? 'relations' : undefined,
      },
    },
  )
}

export async function fetchWorkItemSummaries(
  config: AzureDevOpsConfig,
  ids: number[],
): Promise<Map<number, AzureWorkItemSummary>> {
  if (ids.length === 0) return new Map()

  const dedupedIds = Array.from(new Set(ids))
  const data = await fetchAzureJson<{
    value?: Array<{
      id: number
      url?: string
      fields?: Record<string, unknown>
    }>
  }>(config, '/_apis/wit/workitems', {
    searchParams: {
      ids: dedupedIds.join(','),
      fields: ['System.Title', 'System.State', 'System.WorkItemType'].join(','),
    },
  })

  const map = new Map<number, AzureWorkItemSummary>()
  for (const item of data.value ?? []) {
    map.set(item.id, {
      id: item.id,
      title: toText(item.fields?.['System.Title']),
      state: toText(item.fields?.['System.State']),
      type: toText(item.fields?.['System.WorkItemType']),
      url: item.url ?? null,
    })
  }

  return map
}

export function getWorkItemTeamProject(workItem: AzureWorkItem): string | null {
  return toText(workItem.fields?.['System.TeamProject'])
}

export function toText(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return null
}

export function toIdentity(value: unknown): AzureIdentity | null {
  if (!value || typeof value !== 'object') return null
  const identity = value as Record<string, unknown>
  const displayName = toText(identity.displayName)
  const uniqueName = toText(identity.uniqueName)
  const id = toText(identity.id)

  if (!displayName && !uniqueName && !id) return null
  return {
    id,
    displayName,
    uniqueName,
  }
}

export function splitTags(value: unknown): string[] {
  const tags = toText(value)
  if (!tags) return []
  return tags
    .split(';')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function extractWorkItemIdFromRelationUrl(
  url: string | undefined,
): number | null {
  if (!url) return null
  const match = url.match(/\/workitems\/(\d+)(?:[/?#]|$)/i)
  if (!match) return null

  const parsed = Number.parseInt(match[1], 10)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export function parsePullRequestRef(
  relationUrl: string | undefined,
): AzurePullRequestRef | null {
  if (!relationUrl) return null

  const directMatch = relationUrl.match(
    /\/_apis\/git\/repositories\/([^/]+)\/pullRequests\/(\d+)/i,
  )
  if (directMatch) {
    const pullRequestId = Number.parseInt(directMatch[2], 10)
    if (!Number.isInteger(pullRequestId) || pullRequestId <= 0) return null

    return {
      repoId: decodeURIComponent(directMatch[1]),
      pullRequestId,
      source: 'relation-url',
      relationUrl,
    }
  }

  const artifactMatch = relationUrl.match(
    /^vstfs:\/\/\/Git\/PullRequestId\/(.+)$/i,
  )
  if (!artifactMatch) return null

  const decoded = decodeURIComponent(artifactMatch[1])
  const parts = decoded.split('/')
  if (parts.length < 3) return null

  const repoId = parts[1]
  const pullRequestId = Number.parseInt(parts[2], 10)
  if (!repoId || !Number.isInteger(pullRequestId) || pullRequestId <= 0)
    return null

  return {
    repoId,
    pullRequestId,
    source: 'artifact',
    relationUrl,
  }
}

export function parseCommitRef(
  relationUrl: string | undefined,
): AzureCommitRef | null {
  if (!relationUrl) return null

  const directMatch = relationUrl.match(
    /\/_apis\/git\/repositories\/([^/]+)\/commits\/([^/?#]+)/i,
  )
  if (directMatch) {
    return {
      repoId: decodeURIComponent(directMatch[1]),
      commitId: decodeURIComponent(directMatch[2]),
      source: 'relation-url',
      relationUrl,
    }
  }

  const artifactMatch = relationUrl.match(/^vstfs:\/\/\/Git\/Commit\/(.+)$/i)
  if (!artifactMatch) return null

  const decoded = decodeURIComponent(artifactMatch[1])
  const parts = decoded.split('/')
  if (parts.length < 3) return null

  const repoId = parts[1]
  const commitId = parts[2]
  if (!repoId || !commitId) return null

  return {
    repoId,
    commitId,
    source: 'artifact',
    relationUrl,
  }
}

export function getCommentsApiVersion(): string {
  return COMMENTS_AZURE_API_VERSION
}

function buildAzureUrl(org: string, pathOrUrl: string): URL {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return new URL(pathOrUrl)
  }

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return new URL(
    `https://dev.azure.com/${encodeURIComponent(org)}${normalizedPath}`,
  )
}

function mapAzureStatus(status: number): number {
  if (status === 400) return 400
  if (status === 404) return 404
  return 502
}
