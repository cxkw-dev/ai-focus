import { Icon, type IconName } from '@/components/ui/icon'
import type { Highlights } from '@/types/stats'
import type { AccomplishmentCategory } from '@/types/accomplishment'
import { getCategoryLabel } from './category-badge'

interface HighlightsPanelProps {
  highlights: Highlights
}

interface Highlight {
  icon: IconName
  label: string
  value: string | null
}

/** The year's standout months, label and category as a dawn & dusk description list on a surface. */
export function HighlightsPanel({ highlights }: HighlightsPanelProps) {
  const all: Highlight[] = [
    {
      icon: 'calendar',
      label: 'Busiest month',
      value: highlights.busiestMonth,
    },
    {
      icon: 'success',
      label: 'Most productive',
      value: highlights.mostProductiveMonth,
    },
    { icon: 'tag', label: 'Top label', value: highlights.topLabel },
    {
      icon: 'star',
      label: 'Top category',
      value: highlights.topCategory
        ? getCategoryLabel(highlights.topCategory as AccomplishmentCategory)
        : null,
    },
  ]
  const items = all.filter(
    (item): item is Highlight & { value: string } => !!item.value,
  )

  return (
    <section aria-labelledby="review-highlights-title">
      <header className="dd-table-header">
        <h2 className="dd-table-header__title" id="review-highlights-title">
          highlights
        </h2>
      </header>
      {items.length === 0 ? (
        <div className="dd-surface">
          <div className="dd-empty-state dd-empty-state--compact">
            <div className="dd-empty-state__icon">
              <Icon name="star" />
            </div>
            <h3 className="dd-empty-state__title">No highlights yet</h3>
            <p className="dd-empty-state__text">
              Your busiest month, top label and top category show up here.
            </p>
          </div>
        </div>
      ) : (
        <dl className="dd-description-list dd-description-list--card">
          {items.map((item) => (
            <div key={item.label} className="dd-description-list__item">
              <dt className="dd-description-list__term">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name={item.icon} />
                  {item.label}
                </span>
              </dt>
              <dd className="dd-description-list__details">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
