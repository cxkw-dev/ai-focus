import { NextResponse } from 'next/server'
import {
  AzureDevOpsError,
  fetchWorkItem,
  getAzureDevOpsConfig,
  parseWorkItemId,
  splitTags,
  toIdentity,
  toText,
} from '@/lib/azure-devops'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workItemId = parseWorkItemId(id)
    const config = getAzureDevOpsConfig()
    const item = await fetchWorkItem(config, workItemId, { expandRelations: true })
    const fields = item.fields ?? {}

    const systemLinks = Object.entries(item._links ?? {})
      .map(([type, value]) => {
        const href = typeof value?.href === 'string' ? value.href : null
        return href ? { type, url: href } : null
      })
      .filter((value): value is { type: string; url: string } => value !== null)

    const relationLinks = (item.relations ?? [])
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
        (value): value is { relation: string; name: string | null; comment: string | null; url: string } =>
          value !== null
      )

    return NextResponse.json({
      id: item.id,
      title: toText(fields['System.Title']) ?? '',
      state: toText(fields['System.State']) ?? '',
      assignee: toIdentity(fields['System.AssignedTo']),
      areaPath: toText(fields['System.AreaPath']),
      iterationPath: toText(fields['System.IterationPath']),
      description: toText(fields['System.Description']),
      acceptanceCriteria: toText(fields['Microsoft.VSTS.Common.AcceptanceCriteria']),
      tags: splitTags(fields['System.Tags']),
      links: {
        system: systemLinks,
        relations: relationLinks,
      },
    })
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      )
    }

    console.error('Error fetching Azure work item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Azure work item' },
      { status: 502 }
    )
  }
}
