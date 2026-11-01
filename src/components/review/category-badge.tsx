import { Chip } from '@/components/ui/chip'
import type { AccomplishmentCategory } from '@/types/accomplishment'

// Accomplishment categories take the dawn & dusk colour set in order (skipping apricot, which means "do this").
const CATEGORY_CONFIG: Record<
  AccomplishmentCategory,
  { label: string; set: 1 | 2 | 4 | 5 | 6 | 7 }
> = {
  DELIVERY: { label: 'Delivery', set: 1 },
  HIRING: { label: 'Hiring', set: 2 },
  MENTORING: { label: 'Mentoring', set: 4 },
  COLLABORATION: { label: 'Collaboration', set: 5 },
  GROWTH: { label: 'Growth', set: 6 },
  OTHER: { label: 'Other', set: 7 },
}

export function getCategoryLabel(category: AccomplishmentCategory): string {
  return CATEGORY_CONFIG[category].label
}

/** The category's colour set (1–8), as used by its chip. */
export function getCategorySet(category: AccomplishmentCategory): number {
  return CATEGORY_CONFIG[category].set
}

/** The category's colour token, e.g. `--dd-set-1`. */
export function getCategoryCssVar(category: AccomplishmentCategory): string {
  return `--dd-set-${CATEGORY_CONFIG[category].set}`
}

export function CategoryBadge({
  category,
}: {
  category: AccomplishmentCategory
}) {
  const { label, set } = CATEGORY_CONFIG[category]
  return <Chip set={set}>{label}</Chip>
}
