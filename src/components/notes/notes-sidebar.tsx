'use client'

import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import type { NotebookNote } from '@/types/notebook'
import { IconButton } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Icon, type IconName } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { STATUS_CONFIG } from '@/lib/status'
import { PRIORITY_MAP } from '@/lib/priority'
import { cn } from '@/lib/utils'

type NotesTab = 'notes' | 'tasks' | 'archived'

const TABS: { value: NotesTab; label: string }[] = [
  { value: 'notes', label: 'Notes' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'archived', label: 'Archived' },
]

interface NotesSidebarProps {
  notes: NotebookNote[]
  selectedId: string | null
  isScratchPadActive: boolean
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onOpenScratchPad: () => void
  isLoading: boolean
  className?: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TodoPreviewCard({
  todo,
}: {
  todo: NonNullable<NotebookNote['todo']>
}) {
  const status = STATUS_CONFIG[todo.status]
  const priority = PRIORITY_MAP[todo.priority]

  return (
    <>
      <p className="text-sm leading-tight font-semibold">
        <span className="text-quiet font-mono font-normal">
          #{todo.taskNumber}
        </span>{' '}
        {todo.title}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip color={status.colorVar}>
          <Icon name={status.icon} />
          {status.label}
        </Chip>
        <Chip color={priority.colorVar}>
          <Icon name={priority.icon} />
          {priority.label}
        </Chip>
      </div>

      {todo.dueDate && (
        <p className="text-muted flex items-center gap-1.5 text-xs">
          <Icon name="calendar" />
          <span className="font-mono">
            {new Date(todo.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </p>
      )}

      {todo.labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <Icon name="tag" className="text-muted" />
          {todo.labels.map((label) => (
            <Chip key={label.id} color={label.color}>
              {label.name}
            </Chip>
          ))}
        </div>
      )}
    </>
  )
}

function TodoBadge({ note }: { note: NotebookNote }) {
  const [open, setOpen] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)

  if (!note.todo) return null

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <span
          className="dd-badge dd-badge--count shrink-0 cursor-default"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => e.stopPropagation()}
        >
          #{note.todo.taskNumber}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          sideOffset={8}
          align="start"
          collisionPadding={10}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="dd-popover dd-popover--static z-[70] w-60 p-3"
        >
          <TodoPreviewCard todo={note.todo} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** Notes / Tasks / Archived: a segmented control owned by React state (radio semantics, arrow keys move). */
function NotesTabs({
  value,
  onChange,
}: {
  value: NotesTab
  onChange: (value: NotesTab) => void
}) {
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = TABS.length - 1
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }
    const target = targets[event.key]
    if (target === undefined) return
    event.preventDefault()
    onChange(TABS[target].value)
    itemRefs.current[target]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Show"
      className="dd-segmented dd-segmented--sm dd-segmented--block min-w-0 flex-1"
    >
      {TABS.map((tab, index) => {
        const checked = tab.value === value
        return (
          <button
            key={tab.value}
            ref={(el) => {
              itemRefs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className="dd-segmented__item"
            onClick={() => onChange(tab.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

const EMPTY_STATES: Record<NotesTab, { icon: IconName; title: string }> = {
  notes: { icon: 'file', title: 'No notes yet' },
  tasks: { icon: 'list', title: 'No task notes yet' },
  archived: { icon: 'archive', title: 'No archived notes' },
}

export function NotesSidebar({
  notes,
  selectedId,
  isScratchPadActive,
  onSelect,
  onCreate,
  onDelete,
  onOpenScratchPad,
  isLoading,
  className,
}: NotesSidebarProps) {
  const [search, setSearch] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<NotesTab>('notes')

  const { standaloneNotes, taskNotes, archivedNotes } = React.useMemo(() => {
    const standalone: NotebookNote[] = []
    const tasks: NotebookNote[] = []
    const archived: NotebookNote[] = []
    for (const n of notes) {
      if (
        n.todo &&
        (n.todo.status === 'COMPLETED' || n.todo.status === 'CANCELLED')
      ) {
        continue
      }
      if (n.archived) {
        archived.push(n)
      } else if (n.todo) {
        tasks.push(n)
      } else {
        standalone.push(n)
      }
    }
    return {
      standaloneNotes: standalone,
      taskNotes: tasks,
      archivedNotes: archived,
    }
  }, [notes])

  const filteredNotes = React.useMemo(() => {
    const source =
      activeTab === 'archived'
        ? archivedNotes
        : activeTab === 'tasks'
          ? taskNotes
          : standaloneNotes
    if (!search.trim()) return source
    const q = search.toLowerCase()
    return source.filter((n) => n.title.toLowerCase().includes(q))
  }, [standaloneNotes, taskNotes, archivedNotes, activeTab, search])

  const empty: { icon: IconName; title: string } = search
    ? { icon: 'search', title: 'No notes found' }
    : EMPTY_STATES[activeTab]

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-col gap-2', className)}>
      <div className="flex items-center gap-1.5">
        <NotesTabs value={activeTab} onChange={setActiveTab} />
        <IconButton icon="plus" label="New note" size="sm" onClick={onCreate} />
      </div>

      <Input
        size="sm"
        aria-label="Search notes"
        placeholder="Search notes"
        leading={<Icon name="search" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button
        type="button"
        onClick={onOpenScratchPad}
        aria-current={isScratchPadActive ? 'page' : undefined}
        className={cn(
          'ease-gentle rounded-box flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold transition-colors duration-[var(--dd-dur-fast)]',
          isScratchPadActive
            ? 'bg-wash-strong text-text'
            : 'text-muted hover:bg-wash hover:text-text',
        )}
      >
        <Icon name="edit" />
        <span className="min-w-0 flex-1 truncate">Scratch pad</span>
        <Icon name="pin" className="text-quiet" />
      </button>

      <div className="dd-scroll -mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {isLoading ? (
          <div className="dd-skeleton-group gap-2" aria-busy="true">
            <span className="dd-visually-hidden">Loading notes…</span>
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className="dd-skeleton rounded-box h-14"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="dd-empty-state dd-empty-state--compact">
            <div className="dd-empty-state__icon">
              <Icon name={empty.icon} />
            </div>
            <h3 className="dd-empty-state__title">{empty.title}</h3>
          </div>
        ) : (
          <ul aria-label="Notes" className="flex flex-col gap-0.5">
            {filteredNotes.map((note) => {
              const isSelected = note.id === selectedId
              const preview = stripHtml(note.content).slice(0, 60)
              return (
                <li key={note.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(note.id)}
                    aria-current={isSelected ? 'page' : undefined}
                    className={cn(
                      'ease-gentle rounded-box flex w-full min-w-0 flex-col gap-0.5 py-2 pr-9 pl-3 text-left transition-colors duration-[var(--dd-dur-fast)]',
                      isSelected ? 'bg-wash-strong' : 'hover:bg-wash',
                      note.archived && 'opacity-60',
                    )}
                  >
                    <span className="flex w-full min-w-0 items-center gap-1.5">
                      <span className="text-text truncate text-sm leading-tight font-semibold">
                        {note.title || 'Untitled'}
                      </span>
                      <TodoBadge note={note} />
                    </span>
                    {preview && (
                      <span className="text-muted w-full truncate text-xs">
                        {preview}
                      </span>
                    )}
                    <span className="text-quiet font-mono text-xs">
                      {formatRelativeTime(note.updatedAt)}
                    </span>
                  </button>
                  <IconButton
                    icon="trash"
                    label="Delete note"
                    size="sm"
                    onClick={() => onDelete(note.id)}
                    className="absolute top-1.5 right-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
