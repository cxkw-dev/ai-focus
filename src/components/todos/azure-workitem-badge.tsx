'use client'

import { useAzureWorkItemStatus } from '@/hooks/use-azure-workitem-status'
import type { AzureWorkItemStatus } from '@/types/todo'
import {
  AzureIcon,
  IntegrationBadge,
  IntegrationBadgeLoading,
  IntegrationTitleRow,
  type IntegrationIntent,
} from './integration-badge'

const azureIcon = <AzureIcon />

function getBadgeConfig(data: AzureWorkItemStatus): {
  intent: IntegrationIntent
  label: string
} {
  const state = data.state.toLowerCase()
  if (['done', 'closed', 'resolved'].includes(state))
    return { intent: 'ok', label: data.state }
  if (state === 'removed') return { intent: 'neutral', label: 'Removed' }
  if (['active', 'new', 'committed'].includes(state))
    return { intent: 'info', label: data.state }
  return { intent: 'warn', label: data.state }
}

function extractWorkItemId(url: string): string {
  const match = url.match(/\/edit\/(\d+)/)
  return match ? match[1] : '?'
}

interface AzureWorkItemBadgeProps {
  url: string
  showTitle?: boolean
  status?: AzureWorkItemStatus
  isStatusLoading?: boolean
  fetchStatus?: boolean
}

export function AzureWorkItemBadge({
  url,
  showTitle,
  status,
  isStatusLoading,
  fetchStatus = true,
}: AzureWorkItemBadgeProps) {
  const statusQuery = useAzureWorkItemStatus(fetchStatus && !status ? url : '')
  const data = status ?? statusQuery.data
  const isLoading = data ? false : (isStatusLoading ?? statusQuery.isLoading)
  const isError = data ? false : fetchStatus ? statusQuery.isError : !isLoading

  const itemId = data?.id ?? extractWorkItemId(url)

  if (isLoading) return <IntegrationBadgeLoading reference={itemId} />

  if (isError || !data) {
    return <IntegrationBadge url={url} reference={itemId} icon={azureIcon} />
  }

  const config = getBadgeConfig(data)
  const badge = (
    <IntegrationBadge
      url={url}
      reference={data.id}
      icon={azureIcon}
      intent={config.intent}
      label={config.label}
      tip={`${data.title} — ${config.label}`}
    />
  )

  if (!showTitle) return badge

  return <IntegrationTitleRow badge={badge} title={data.title} />
}
