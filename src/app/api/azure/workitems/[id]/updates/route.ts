import { NextResponse } from 'next/server'
import {
  AzureDevOpsError,
  fetchAzureJson,
  getAzureDevOpsConfig,
  parseWorkItemId,
  toIdentity,
  toText,
} from '@/lib/azure-devops'

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const workItemId = parseWorkItemId(id)
    const config = getAzureDevOpsConfig()

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

    return NextResponse.json({
      workItemId,
      count: updates.length,
      updates,
    })
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      )
    }

    console.error('Error fetching Azure work item updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Azure work item updates' },
      { status: 502 },
    )
  }
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
