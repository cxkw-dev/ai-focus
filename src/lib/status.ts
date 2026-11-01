import type { IconName } from '@/components/ui/icon'
import type { Status } from '@/types/todo'

export interface StatusConfigEntry {
  label: string
  /** dawn & dusk icon name; render with <Icon name={config.icon} />. */
  icon: IconName
  /** Token colour for the status: status tokens where the lane means a state, set tokens where it's a category. */
  colorVar: string
  bgVar: string
}

const entry = (label: string, icon: IconName, token: string) => ({
  label,
  icon,
  colorVar: `var(${token})`,
  bgVar: `var(${token})`,
})

// Canonical status metadata. The board (StatusChip/StatusDropdown) is the source of truth for wording and colour;
// every other surface derives from here. Colours follow dawn & dusk: pending → info, waiting → warn,
// blocked → bad, done → ok, parked/dropped → muted; review and on-hold take set colours so every lane stays distinct.
export const STATUS_CONFIG: Record<Status, StatusConfigEntry> = {
  TODO: entry('To Do', 'inbox', '--dd-muted'),
  IN_PROGRESS: entry('In Progress', 'play', '--dd-info'),
  WAITING: entry('Waiting', 'clock', '--dd-warn'),
  UNDER_REVIEW: entry('Under Review', 'eye', '--dd-set-6'),
  ON_HOLD: entry('On Hold', 'pause', '--dd-set-5'),
  BLOCKED: entry('Blocked', 'danger', '--dd-bad'),
  COMPLETED: entry('Done', 'success', '--dd-ok'),
  CANCELLED: entry('Cancelled', 'x', '--dd-quiet'),
}

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

// Keys into the chart palette (hooks/use-chart-colors.ts).
export const STATUS_COLOR_KEYS: Record<Status, string> = {
  TODO: 'statusTodo',
  IN_PROGRESS: 'statusInProgress',
  WAITING: 'statusWaiting',
  UNDER_REVIEW: 'statusUnderReview',
  ON_HOLD: 'statusOnHold',
  BLOCKED: 'statusBlocked',
  COMPLETED: 'statusDone',
  CANCELLED: 'textMuted',
}
