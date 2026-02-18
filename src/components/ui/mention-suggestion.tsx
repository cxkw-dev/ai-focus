import * as React from 'react'

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
    [items, command]
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

  if (items.length === 0) {
    return (
      <div
        className="rounded-lg border p-2 text-xs shadow-lg"
        style={{
          backgroundColor: 'var(--surface-2)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-muted)',
        }}
      >
        No people found
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border py-1 shadow-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-2)',
        borderColor: 'var(--border-color)',
      }}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors"
          style={{
            backgroundColor:
              index === selectedIndex
                ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                : 'transparent',
            color:
              index === selectedIndex ? 'var(--primary)' : 'var(--text-primary)',
          }}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="font-medium">{item.name}</span>
          <span
            className="text-xs truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {item.email}
          </span>
        </button>
      ))}
    </div>
  )
})
