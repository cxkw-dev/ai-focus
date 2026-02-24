import { NextResponse } from 'next/server'
import {
  AzureDevOpsError,
  extractWorkItemIdFromRelationUrl,
  fetchWorkItem,
  fetchWorkItemSummaries,
  getAzureDevOpsConfig,
  parseWorkItemId,
  toText,
} from '@/lib/azure-devops'

interface RelationEntry {
  id: number
  relation: string
  url: string
  name: string | null
  comment: string | null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workItemId = parseWorkItemId(id)
    const config = getAzureDevOpsConfig()
    const workItem = await fetchWorkItem(config, workItemId, { expandRelations: true })

    const parents: RelationEntry[] = []
    const children: RelationEntry[] = []
    const dependsOn: RelationEntry[] = []
    const related: RelationEntry[] = []

    for (const relation of workItem.relations ?? []) {
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
      new Set([...parents, ...children, ...dependsOn, ...related].map((entry) => entry.id))
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

    return NextResponse.json({
      workItemId,
      parent: parentEntries[0] ?? null,
      parents: parentEntries,
      children: childEntries,
      dependsOn: dependsOnEntries,
      related: relatedEntries,
    })
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      )
    }

    console.error('Error fetching Azure work item relations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Azure work item relations' },
      { status: 502 }
    )
  }
}
