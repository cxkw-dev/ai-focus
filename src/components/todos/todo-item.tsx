'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, GripVertical } from 'lucide-react'
import { cn, formatRelativeDate } from '@/lib/utils'
import { getBillingCodeEntries } from '@/lib/labels'
import { PrDependencyTree } from './pr-dependency-tree'
import { TodoDescriptionPreview } from './todo-description-preview'
import { SessionList } from './session-list'
import { CollapsedTodoRow } from './collapsed-todo-row'
import { renderTextWithLinks } from './linkified-text'
import { COLLAPSED_STATUSES } from './todo-display'
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

const BlockedExpandedContext = React.createContext(false)
const TODO_CARD_BACKGROUND = 'var(--surface-2)'
const URGENT_TODO_CARD_BACKGROUND =
  'linear-gradient(135deg, color-mix(in srgb, var(--priority-urgent) 13%, var(--surface-2)) 0%, var(--surface-2) 72%)'

export function BlockedExpandedProvider({
  expanded,
  children,
}: {
  expanded: boolean
  children: React.ReactNode
}) {
  return (
    <BlockedExpandedContext.Provider value={expanded}>
      {children}
    </BlockedExpandedContext.Provider>
  )
}

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
  onCollapse?: () => void
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
  onCollapse,
}: TodoItemProps) {
  const isCompleted = todo.status === 'COMPLETED'
  const isUrgent = todo.priority === 'URGENT' && viewMode === 'active'
  const canInlineEditSubtasks = viewMode === 'active' && !isDragging
  const hasIntegrations =
    (todo.myPrUrls ?? []).length > 0 ||
    (todo.githubPrUrls ?? []).length > 0 ||
    !!todo.azureWorkItemUrl ||
    (todo.azureDepUrls ?? []).length > 0 ||
    (todo.myIssueUrls ?? []).length > 0 ||
    (todo.githubIssueUrls ?? []).length > 0

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <TodoItemMetaRow
                todo={todo}
                viewMode={viewMode}
                onStatusChange={onStatusChange}
                onPriorityChange={onPriorityChange}
              />
            </div>
            <TodoItemActions
              todo={todo}
              viewMode={viewMode}
              onDelete={onDelete}
              onEdit={onEdit}
              onRestore={onRestore}
              onOpenNote={onOpenNote}
              onCollapse={onCollapse}
            />
          </div>

          <div
            className="relative rounded-md px-2.5 py-2"
            style={{
              backgroundColor: isUrgent
                ? 'color-mix(in srgb, var(--priority-urgent) 7%, var(--background))'
                : 'color-mix(in srgb, var(--background) 50%, transparent)',
            }}
          >
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  'text-[13px] leading-snug font-semibold break-words',
                  isUrgent && 'font-bold',
                  isCompleted && 'line-through',
                )}
                style={{
                  color: isCompleted
                    ? 'var(--text-muted)'
                    : 'var(--text-primary)',
                }}
              >
                {renderTextWithLinks(todo.title)}
              </h3>
              {todo.dueDate && (
                <span
                  className="inline-flex flex-shrink-0 items-center gap-1 text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Calendar className="h-2.5 w-2.5" />
                  {formatRelativeDate(todo.dueDate)}
                </span>
              )}
            </div>
            {todo.description && (
              <TodoDescriptionPreview description={todo.description} />
            )}
          </div>
        </div>
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
  const blockedExpanded = React.useContext(BlockedExpandedContext)
  const isCollapsible =
    viewMode === 'active' && COLLAPSED_STATUSES.has(todo.status)
  const [manuallyExpanded, setManuallyExpanded] = React.useState(false)

  // Reset manually-expanded flag when the todo's status moves out of a collapsed state.
  const [prevStatus, setPrevStatus] = React.useState(todo.status)
  if (prevStatus !== todo.status) {
    setPrevStatus(todo.status)
    if (!COLLAPSED_STATUSES.has(todo.status)) {
      setManuallyExpanded(false)
    }
  }

  // Collapse the billing drawer if the todo no longer has billing entries.
  const [prevHasBillingEntries, setPrevHasBillingEntries] =
    React.useState(hasBillingEntries)
  if (prevHasBillingEntries !== hasBillingEntries) {
    setPrevHasBillingEntries(hasBillingEntries)
    if (!hasBillingEntries) {
      setBillingOpen(false)
    }
  }

  const dropLine = (
    <div
      className="mx-1 h-0.5 rounded-full transition-all"
      style={{ backgroundColor: 'var(--primary)' }}
    />
  )

  const showCollapsed =
    isCollapsible && !manuallyExpanded && !blockedExpanded && !dragging

  const shellClassName = cn(
    'min-w-0 transition-opacity duration-150',
    !dragging && '[contain-intrinsic-size:0_220px] [content-visibility:auto]',
    dragging && 'opacity-50',
  )

  const cardBody = (
    <>
      {dropIndicator === 'above' && dropLine}
      {showCollapsed ? (
        <div className="flex items-center gap-0.5">
          <div className="flex w-[18px] flex-shrink-0 justify-center">
            <button
              {...attributes}
              {...listeners}
              className={cn(
                'todo-drag-handle cursor-grab touch-none self-center rounded p-0.5 transition-colors',
                dragging && 'cursor-grabbing',
              )}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <CollapsedTodoRow
              todo={todo}
              onClick={() => setManuallyExpanded(true)}
            />
          </div>
        </div>
      ) : (
        <div className="todo-card-shell flex items-center gap-0.5">
          {/* Reserve a consistent gutter so the card body stays aligned across filters */}
          <div className="flex w-[18px] flex-shrink-0 justify-center">
            {!isDragDisabled && (
              <button
                {...attributes}
                {...listeners}
                className={cn(
                  'todo-drag-handle cursor-grab touch-none self-center rounded p-0.5 transition-colors',
                  dragging && 'cursor-grabbing',
                )}
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Card */}
          <div
            className={cn(
              'group todo-card relative min-w-0 flex-1 overflow-visible px-3 py-2.5 transition-all duration-150',
              isUrgent && 'todo-card-urgent',
              dragging ? 'rounded-lg' : 'rounded-l-lg',
              dragging && 'z-50 shadow-lg',
              (isCompleted || viewMode !== 'active') && 'opacity-50',
            )}
            style={{
              background: isUrgent
                ? URGENT_TODO_CARD_BACKGROUND
                : TODO_CARD_BACKGROUND,
              boxShadow: dragging
                ? '0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent)'
                : undefined,
            }}
          >
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
              onCollapse={
                manuallyExpanded ? () => setManuallyExpanded(false) : undefined
              }
            />
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
          </div>

          {/* Side tabs — stacked vertically */}
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
        </div>
      )}
      {dropIndicator === 'below' && dropLine}
    </>
  )

  // A motion.div costs a VisualElement and a projection node per card even when
  // every animation prop is inert. Boards mount their cards with transitions
  // off, so give those a plain div and skip the framer machinery entirely.
  if (!animateTransitions) {
    return (
      <div ref={setNodeRef} style={style} className={shellClassName}>
        {cardBody}
      </div>
    )
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!dragging}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.16 } }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={shellClassName}
    >
      {cardBody}
    </motion.div>
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
    <div className="flex items-center gap-0.5">
      <div className="todo-drag-handle flex-shrink-0 p-0.5">
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <div
        className={cn(
          'group todo-card relative flex-1 overflow-visible rounded-lg px-3 py-2.5 shadow-2xl',
          isUrgent && 'todo-card-urgent',
          isCompleted && 'opacity-50',
        )}
        style={{
          background: isUrgent
            ? URGENT_TODO_CARD_BACKGROUND
            : TODO_CARD_BACKGROUND,
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent)',
        }}
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
      </div>
    </div>
  )
}
