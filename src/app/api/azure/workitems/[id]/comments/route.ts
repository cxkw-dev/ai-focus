import { NextResponse } from 'next/server'
import {
  AzureDevOpsError,
  fetchAzureJson,
  fetchWorkItem,
  getAzureDevOpsConfig,
  getCommentsApiVersion,
  getWorkItemTeamProject,
  parseWorkItemId,
  toIdentity,
  toText,
} from '@/lib/azure-devops'

interface AzureComment {
  id: number
  text?: string
  renderedText?: string
  createdDate?: string
  modifiedDate?: string
  createdBy?: unknown
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workItemId = parseWorkItemId(id)
    const config = getAzureDevOpsConfig()
    const workItem = await fetchWorkItem(config, workItemId, {
      fields: ['System.TeamProject'],
    })
    const teamProject = getWorkItemTeamProject(workItem)

    if (!teamProject) {
      throw new AzureDevOpsError(
        'Could not determine Team Project for this work item',
        502
      )
    }

    const response = await fetchAzureJson<{ comments?: AzureComment[] }>(
      config,
      `/${encodeURIComponent(teamProject)}/_apis/wit/workitems/${workItemId}/comments`,
      {
        apiVersion: getCommentsApiVersion(),
      }
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

    return NextResponse.json({
      workItemId,
      count: comments.length,
      comments,
    })
  } catch (error) {
    if (error instanceof AzureDevOpsError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      )
    }

    console.error('Error fetching Azure work item comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Azure work item comments' },
      { status: 502 }
    )
  }
}
