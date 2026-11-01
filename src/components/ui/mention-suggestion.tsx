import * as React from 'react'
import { cn } from '@/lib/utils'

export interface MentionSuggestionItem {
  id: string
  name: string
  email: string
}

interface MentionSuggestionListProps {
  items: MentionSuggestionItem[]
  command: (item: { id: string; label: string; email: string }) => void
}

export const MentionSuggestionList = React.forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  MentionSuggestionListProps
>(function MentionSuggestionList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  const selectItem = React.useCallback(
    (index: number) => {
      const item = items[index]
      if (item) {
        command({ id: item.id, label: item.name, email: item.email })
      }
    },
    [items, command],
  )

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  return (
    <ul
      role="listbox"
      aria-label="People"
      // At most eight people: show them all (no inner scroll; a modal dialog would swallow its wheel).
      className="dd-listbox dd-listbox--static max-h-none min-w-52"
    >
      {items.length === 0 ? (
        <li className="dd-listbox__empty" role="presentation">
          No people found
        </li>
      ) : (
        items.map((item, index) => (
          <li
            key={item.id}
            role="option"
            aria-selected={false}
            className={cn(
              'dd-listbox__option',
              index === selectedIndex && 'is-active',
            )}
            // Keep focus (and the caret) in the editor while picking.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="dd-listbox__text">
              <span>{item.name}</span>
              <span className="dd-listbox__desc truncate">{item.email}</span>
            </span>
          </li>
        ))
      )}
    </ul>
  )
})
