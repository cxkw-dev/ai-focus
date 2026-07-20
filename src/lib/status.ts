import type { ElementType } from 'react'
import {
  Ban,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Pause,
  Play,
  XCircle,
} from 'lucide-react'
import type { Status } from '@/types/todo'

export interface StatusConfigEntry {
  label: string
  icon: ElementType
  colorVar: string
  bgVar: string
}

// Canonical status metadata. The board (StatusChip/StatusDropdown) is the
// source of truth for wording and color; every other surface derives from here.
export const STATUS_CONFIG: Record<Status, StatusConfigEntry> = {
  TODO: {
    label: 'To Do',
    icon: Circle,
    colorVar: 'var(--status-todo)',
    bgVar: 'var(--status-todo)',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Play,
    colorVar: 'var(--status-in-progress)',
    bgVar: 'var(--status-in-progress)',
  },
  WAITING: {
    label: 'Waiting',
    icon: Clock,
    colorVar: 'var(--status-waiting)',
    bgVar: 'var(--status-waiting)',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    icon: Eye,
    colorVar: 'var(--status-under-review)',
    bgVar: 'var(--status-under-review)',
  },
  ON_HOLD: {
    label: 'On Hold',
    icon: Pause,
    colorVar: 'var(--status-on-hold)',
    bgVar: 'var(--status-on-hold)',
  },
  BLOCKED: {
    label: 'Blocked',
    icon: Ban,
    colorVar: 'var(--status-blocked)',
    bgVar: 'var(--status-blocked)',
  },
  COMPLETED: {
    label: 'Done',
    icon: CheckCircle2,
    colorVar: 'var(--status-done)',
    bgVar: 'var(--status-done)',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    colorVar: 'var(--status-on-hold)',
    bgVar: 'var(--status-on-hold)',
  },
}

// Statuses that collapse to a compact row on the active board.
export const COLLAPSED_STATUSES = new Set<Status>([
  'WAITING',
  'UNDER_REVIEW',
  'ON_HOLD',
  'BLOCKED',
])

export const STATUS_LABELS = Object.fromEntries(
  (Object.entries(STATUS_CONFIG) as [Status, StatusConfigEntry][]).map(
    ([key, config]) => [key, config.label],
  ),
) as Record<Status, string>

export const STATUS_COLOR_VARS = Object.fromEntries(
  (Object.entries(STATUS_CONFIG) as [Status, StatusConfigEntry][]).map(
    ([key, config]) => [key, config.colorVar],
  ),
) as Record<Status, string>

// Keys into the ChartColors palette (see lib/themes.ts). There is no dedicated
// cancelled swatch, so cancelled reuses the on-hold color like STATUS_CONFIG.
export const STATUS_COLOR_KEYS: Record<Status, string> = {
  TODO: 'statusTodo',
  IN_PROGRESS: 'statusInProgress',
  WAITING: 'statusWaiting',
  UNDER_REVIEW: 'statusUnderReview',
  ON_HOLD: 'statusOnHold',
  BLOCKED: 'statusBlocked',
  COMPLETED: 'statusDone',
  CANCELLED: 'statusOnHold',
}
