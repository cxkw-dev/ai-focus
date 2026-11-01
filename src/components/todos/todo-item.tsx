'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { cn, formatRelativeDate } from '@/lib/utils'
import { getBillingCodeEntries } from '@/lib/labels'
import { PrDependencyTree } from './pr-dependency-tree'
import { TodoDescriptionPreview } from './todo-description-preview'
import { SessionList } from './session-list'
import { renderTextWithLinks } from './linkified-text'
import { TodoItemActions } from './todo-item-actions'
import { TodoItemMetaRow } from './todo-item-meta-row'
import { TodoItemSideTabs } from './todo-item-side-tabs'
import { TodoInlineSubtasks } from './todo-inline-subtasks'
import type { Todo, Status, Priority, SubtaskInput } from '@/types/todo'
import type { Person } from '@/types/person'

const BillingCodesDrawer = dynamic(
  () => import('./billing-codes-drawer').then((mod) => mod.BillingCodesDrawer),
  { ssr: false },
)

const ContactsDrawer = dynamic(
  () => import('./contacts-drawer').then((mod) => mod.ContactsDrawer),
  { ssr: false },
)

const StatusUpdatesDrawer = dynamic(
  () =>
    import('./status-updates-drawer').then((mod) => mod.StatusUpdatesDrawer),
  { ssr: false },
)

export type ViewMode = 'active' | 'completed' | 'deleted'

interface TodoItemProps {
  todo: Todo
  onStatusChange: (id: string, status: Status) => void
  onPriorityChange: (id: string, priority: Priority) => void
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  onRestore?: (id: string) => void
  onToggleSubtask?: (
    todoId: string,
    subtaskId: string,
    completed: boolean,
  ) => void
  onUpdateSubtasks?: (todoId: string, subtasks: SubtaskInput[]) => void
  onOpenNote?: (todoId: string, noteId: string) => void
  people: Person[]
  subtaskMentions: Array<Pick<Person, 'id' | 'name' | 'email'>>
  isDragging?: boolean
  viewMode?: ViewMode
  dropIndicator?: 'above' | 'below' | null
  animateTransitions?: boolean
  /**
   * Overrides the default "only active cards drag" rule. The project board
   * needs completed cards draggable so they can be pulled back out of Done.
   */
  dragDisabled?: boolean
}

function TodoItemContent({
  todo,
  onStatusChange,
  onPriorityChange,
  onDelete,
  onEdit,
  onRestore,
  onToggleSubtask,
  onUpdateSubtasks,
  onOpenNote,
  subtaskMentions,
  isDragging,
  viewMode = 'active',
}: TodoItemProps) {
  const isCompleted = todo.status === 'COMPLETED'
  const canInlineEditSubtasks = viewMode === 'active' && !isDragging
  const overdue =
    viewMode === 'active' && !!todo.dueDate && isPastDue(todo.dueDate)
  const hasIntegrations =
    (todo.myPrUrls ?? []).length > 0 ||
    (todo.githubPrUrls ?? []).length > 0 ||
    !!todo.azureWorkItemUrl ||
    (todo.azureDepUrls ?? []).length > 0 ||
    (todo.myIssueUrls ?? []).length > 0 ||
    (todo.githubIssueUrls ?? []).length > 0

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <TodoItemMetaRow
        todo={todo}
        viewMode={viewMode}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        actions={
          <TodoItemActions
            todo={todo}
            viewMode={viewMode}
            onDelete={onDelete}
            onEdit={onEdit}
            onRestore={onRestore}
            onOpenNote={onOpenNote}
          />
        }
      />

      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <h3
            className={cn(
              'min-w-0 flex-1 text-sm leading-snug font-semibold break-words',
              isCompleted ? 'text-muted line-through' : 'text-text',
            )}
          >
            {renderTextWithLinks(todo.title)}
          </h3>
          {todo.dueDate && (
            <span
              className={cn(
                'inline-flex flex-none items-center gap-1 font-mono text-xs',
                overdue ? 'text-bad' : 'text-muted',
              )}
            >
              <Icon name={overdue ? 'alert' : 'calendar'} />
              {formatRelativeDate(todo.dueDate)}
            </span>
          )}
        </div>
        {todo.description && (
          <TodoDescriptionPreview description={todo.description} />
        )}
      </div>

      {/* Integrations */}
      {hasIntegrations && (
        <PrDependencyTree
          myPrUrls={todo.myPrUrls ?? []}
          githubPrUrls={todo.githubPrUrls ?? []}
          azureWorkItemUrl={todo.azureWorkItemUrl}
          azureDepUrls={todo.azureDepUrls ?? []}
          myIssueUrls={todo.myIssueUrls ?? []}
          githubIssueUrls={todo.githubIssueUrls ?? []}
          liveStatus={viewMode === 'active'}
        />
      )}

      <TodoInlineSubtasks
        todoId={todo.id}
        sourceSubtasks={todo.subtasks}
        canInlineEdit={canInlineEditSubtasks}
        mentions={subtaskMentions}
        onToggleSubtask={onToggleSubtask}
        onUpdateSubtasks={onUpdateSubtasks}
      />

      {todo.sessions && todo.sessions.length > 0 && (
        <SessionList sessions={todo.sessions} />
      )}
    </div>
  )
}

function TodoItemComponent({
  todo,
  onStatusChange,
  onPriorityChange,
  onDelete,
  onEdit,
  onRestore,
  onToggleSubtask,
  onUpdateSubtasks,
  onOpenNote,
  people,
  subtaskMentions,
  isDragging: isOverlay,
  viewMode = 'active',
  dropIndicator,
  animateTransitions = true,
  dragDisabled,
}: TodoItemProps) {
  const isDragDisabled = dragDisabled ?? viewMode !== 'active'
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: isDragDisabled })

  const billingEntries = React.useMemo(
    () => getBillingCodeEntries(todo.labels ?? []),
    [todo.labels],
  )
  const hasBillingEntries = billingEntries.length > 0
  const [billingOpen, setBillingOpen] = React.useState(false)
  const [contactsOpen, setContactsOpen] = React.useState(false)
  const [timelineOpen, setTimelineOpen] = React.useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragging = isOverlay || isDragging
  const isCompleted = todo.status === 'COMPLETED'
  const isUrgent = todo.priority === 'URGENT' && viewMode === 'active'

  // Collapse the billing drawer if the todo no longer has billing entries.
  const [prevHasBillingEntries, setPrevHasBillingEntries] =
    React.useState(hasBillingEntries)
  if (prevHasBillingEntries !== hasBillingEntries) {
    setPrevHasBillingEntries(hasBillingEntries)
    if (!hasBillingEntries) {
      setBillingOpen(false)
    }
  }

  const dropLine = <div className="rounded-pill bg-accent mx-1 h-0.5" />

  const cardBody = (
    <>
      {dropIndicator === 'above' && dropLine}
      <article
        className={cn(
          'group rounded-box bg-surface-2 hover:bg-surface-3 relative flex min-w-0 transition-colors',
          isUrgent && 'app-urgent-rail',
          (isCompleted || viewMode !== 'active') && 'opacity-60',
        )}
      >
        {/* The handle lives in the card's own left padding, so cards keep the
            lane's edges (header, add-task box) instead of hanging off a gutter. */}
        {!isDragDisabled && (
          <button
            type="button"
            aria-label="Drag to move"
            {...attributes}
            {...listeners}
            className={cn(
              'text-quiet hover:text-text absolute inset-y-0 left-0 z-[1] flex w-3.5 touch-none items-center justify-center text-xs opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
              dragging ? 'cursor-grabbing' : 'cursor-grab',
            )}
          >
            <GripVertical className="size-[1.15em]" aria-hidden />
          </button>
        )}
        <div className="min-w-0 flex-1 py-2 pr-2.5 pl-3.5">
          <TodoItemContent
            todo={todo}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onDelete={onDelete}
            onEdit={onEdit}
            onRestore={onRestore}
            onToggleSubtask={onToggleSubtask}
            onUpdateSubtasks={onUpdateSubtasks}
            onOpenNote={onOpenNote}
            people={people}
            subtaskMentions={subtaskMentions}
            isDragging={dragging}
            viewMode={viewMode}
          />
        </div>

        {!dragging && (
          <TodoItemSideTabs
            hasBillingEntries={hasBillingEntries}
            billingOpen={billingOpen}
            contactsOpen={contactsOpen}
            timelineOpen={timelineOpen}
            setBillingOpen={setBillingOpen}
            setContactsOpen={setContactsOpen}
            setTimelineOpen={setTimelineOpen}
          />
        )}

        {billingOpen && (
          <BillingCodesDrawer
            entries={billingEntries}
            open={billingOpen}
            onClose={() => setBillingOpen(false)}
          />
        )}
        {contactsOpen && (
          <ContactsDrawer
            todoId={todo.id}
            open={contactsOpen}
            onClose={() => setContactsOpen(false)}
            people={people}
          />
        )}
        {timelineOpen && (
          <StatusUpdatesDrawer
            todoId={todo.id}
            open={timelineOpen}
            onClose={() => setTimelineOpen(false)}
          />
        )}
      </article>
      {dropIndicator === 'below' && dropLine}
    </>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'min-w-0 transition-opacity',
        // Off-screen cards skip layout and paint until scrolled to.
        !dragging &&
          '[contain-intrinsic-size:0_220px] [content-visibility:auto]',
        dragging && 'opacity-50',
        animateTransitions && 'animate-fade-in',
      )}
    >
      {cardBody}
    </div>
  )
}

/**
 * Cards re-render whenever their board does — a drag hover, a mutation
 * settling, an SSE refresh. Every handler upstream is a stable useCallback and
 * the arrays are memoised, so a props check keeps untouched cards untouched.
 */
export const TodoItem = React.memo(TodoItemComponent)

export function TodoItemOverlay({
  todo,
  onStatusChange,
  onPriorityChange,
  onDelete,
  onEdit,
  people,
  subtaskMentions,
}: Omit<TodoItemProps, 'isDragging' | 'viewMode' | 'dropIndicator'>) {
  const isCompleted = todo.status === 'COMPLETED'
  const isUrgent = todo.priority === 'URGENT'

  return (
    <article
      className={cn(
        'rounded-box bg-surface-3 shadow-float relative min-w-0 cursor-grabbing py-2 pr-2.5 pl-3.5',
        isUrgent && 'app-urgent-rail',
        isCompleted && 'opacity-60',
      )}
    >
      <TodoItemContent
        todo={todo}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onDelete={onDelete}
        onEdit={onEdit}
        people={people}
        subtaskMentions={subtaskMentions}
        isDragging={true}
      />
    </article>
  )
}

/** Due before today (by calendar day, in local time). */
function isPastDue(date: string) {
  const due = new Date(date)
  const now = new Date()
  return (
    new Date(due.getFullYear(), due.getMonth(), due.getDate()) <
    new Date(now.getFullYear(), now.getMonth(), now.getDate())
  )
}
