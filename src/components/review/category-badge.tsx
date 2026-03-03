'use client'

import type { AccomplishmentCategory } from '@/types/accomplishment'

const CATEGORY_CONFIG: Record<AccomplishmentCategory, { label: string; cssVar: string }> = {
  DELIVERY: { label: 'Delivery', cssVar: '--category-delivery' },
  HIRING: { label: 'Hiring', cssVar: '--category-hiring' },
  MENTORING: { label: 'Mentoring', cssVar: '--category-mentoring' },
  COLLABORATION: { label: 'Collaboration', cssVar: '--category-collaboration' },
  GROWTH: { label: 'Growth', cssVar: '--category-growth' },
  OTHER: { label: 'Other', cssVar: '--category-other' },
}

export function getCategoryLabel(category: AccomplishmentCategory): string {
  return CATEGORY_CONFIG[category].label
}

export function getCategoryCssVar(category: AccomplishmentCategory): string {
  return CATEGORY_CONFIG[category].cssVar
}

interface CategoryBadgeProps {
  category: AccomplishmentCategory
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const { label, cssVar } = CATEGORY_CONFIG[category]
  const color = `var(${cssVar})`

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      }}
    >
      {label}
    </span>
  )
}
