'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Trash2,
  Calendar,
  Edit2,
  GripVertical,
  RotateCcw,
  Clock,
  Users,
  FileText,
  DollarSign,
  Minimize2,
} from 'lucide-react'
import { cn, formatRelativeDate } from '@/lib/utils'
import { getBillingCodeEntries } from '@/lib/labels'
import { linkifyHtml, mentionifyHtml } from '@/lib/rich-text'
import { PrDependencyTree } from './pr-dependency-tree'
import { ContactsDrawer } from './contacts-drawer'
import { StatusUpdatesDrawer } from './status-updates-drawer'
import { SessionList } from './session-list'
import { BillingCodesDrawer } from './billing-codes-drawer'
import { CollapsedTodoRow } from './collapsed-todo-row'
import { renderTextWithLinks } from './linkified-text'
import {
  CHIP_BASE,
  COLLAPSED_STATUSES,
  PriorityChip,
  PriorityDropdown,
  StatusChip,
  StatusDropdown,
  TodoLabelChip,
} from './todo-display'
import { TodoInlineSubtasks } from './todo-inline-subtasks'
import type { Todo, Status, Priority, SubtaskInput } from '@/types/todo'
import type { Person } from '@/types/person'

const BlockedExpandedContext = React.createContext(false)

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

type ViewMode = 'active' | 'completed' | 'deleted'

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
              <div className="mb-2 flex flex-wrap items-center gap-1">
                {viewMode === 'active' && (
                  <StatusDropdown todo={todo} onStatusChange={onStatusChange} />
                )}
                {viewMode === 'completed' && (
                  <StatusChip status={todo.status} />
                )}
                {viewMode === 'active' ? (
                  <PriorityDropdown
                    todo={todo}
                    onPriorityChange={onPriorityChange}
                  />
                ) : (
                  <PriorityChip priority={todo.priority} />
                )}
                {todo.labels?.map((label) => (
                  <TodoLabelChip
                    key={label.id}
                    label={label}
                    className="max-w-[8rem] truncate"
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              {onCollapse && (
                <button
                  onClick={onCollapse}
                  className={cn(CHIP_BASE, 'todo-action-edit')}
                  title="Collapse"
                >
                  <Minimize2 className="h-3 w-3" />
                </button>
              )}
              {(viewMode === 'active' || viewMode === 'completed') && (
                <>
                  {todo.notebookNoteId && (
                    <button
                      onClick={() =>
                        onOpenNote?.(todo.id, todo.notebookNoteId!)
                      }
                      className={cn(CHIP_BASE, 'todo-action-edit')}
                      title="Open note"
                    >
                      <FileText className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(todo)}
                    className={cn(CHIP_BASE, 'todo-action-edit')}
                    title="Edit"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDelete(todo.id)}
                    className={cn(CHIP_BASE, 'todo-action-delete')}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
              {viewMode === 'deleted' && (
                <>
                  <button
                    onClick={() => onRestore?.(todo.id)}
                    className={cn(CHIP_BASE, 'todo-action-restore')}
                    title="Restore"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDelete(todo.id)}
                    className={cn(CHIP_BASE, 'todo-action-destroy')}
                    title="Delete permanently"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
              <span
                className="font-mono text-[11px] font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                #{todo.taskNumber}
              </span>
            </div>
          </div>

          <div
            className="relative rounded-md px-2.5 py-2"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--background) 50%, transparent)',
            }}
          >
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  'text-[13px] leading-snug font-medium break-words',
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
            {todo.description &&
              (todo.description.startsWith('<') ? (
                <div
                  className="rich-text-display mt-1.5 line-clamp-2 leading-snug break-words"
                  dangerouslySetInnerHTML={{
                    __html: linkifyHtml(mentionifyHtml(todo.description)),
                  }}
                />
              ) : (
                <p
                  className="mt-1.5 line-clamp-2 text-[11px] leading-snug break-words"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {renderTextWithLinks(todo.description)}
                </p>
              ))}
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

export function TodoItem({
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
}: TodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: viewMode !== 'active' })

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

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={animateTransitions && !dragging}
      initial={animateTransitions ? { opacity: 0, y: 8 } : false}
      animate={animateTransitions ? { opacity: 1, y: 0 } : { opacity: 1 }}
      exit={
        animateTransitions
          ? { opacity: 0, x: -12, transition: { duration: 0.16 } }
          : { opacity: 0 }
      }
      transition={
        animateTransitions
          ? { duration: 0.16, ease: 'easeOut' }
          : { duration: 0.01 }
      }
      className={cn(
        'min-w-0 transition-opacity duration-150',
        dragging && 'opacity-50',
      )}
    >
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
        <div className="flex items-center gap-0.5">
          {/* Reserve a consistent gutter so the card body stays aligned across filters */}
          <div className="flex w-[18px] flex-shrink-0 justify-center">
            {viewMode === 'active' && (
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
              dragging ? 'rounded-lg' : 'rounded-l-lg',
              dragging && 'z-50 shadow-lg',
              (isCompleted || viewMode !== 'active') && 'opacity-50',
            )}
            style={{
              backgroundColor: 'var(--surface-2)',
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
            <BillingCodesDrawer
              entries={billingEntries}
              open={billingOpen}
              onClose={() => setBillingOpen(false)}
            />
            <ContactsDrawer
              todoId={todo.id}
              open={contactsOpen}
              onClose={() => setContactsOpen(false)}
              people={people}
            />
            <StatusUpdatesDrawer
              todoId={todo.id}
              open={timelineOpen}
              onClose={() => setTimelineOpen(false)}
            />
          </div>

          {/* Side tabs — stacked vertically */}
          {!dragging && (
            <div className="flex flex-shrink-0 flex-col gap-px self-stretch">
              {hasBillingEntries && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setBillingOpen((prev) => !prev)
                    setContactsOpen(false)
                    setTimelineOpen(false)
                  }}
                  className={cn(
                    'todo-billing-tab flex w-5 flex-1 items-center justify-center rounded-tr-lg transition-all duration-150',
                    billingOpen && 'todo-billing-tab-active',
                  )}
                  title="Billing codes"
                >
                  <DollarSign className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setContactsOpen((prev) => !prev)
                  setBillingOpen(false)
                  setTimelineOpen(false)
                }}
                className={cn(
                  'todo-contacts-tab flex w-5 flex-1 items-center justify-center transition-all duration-150',
                  !hasBillingEntries && 'rounded-tr-lg',
                  contactsOpen && 'todo-contacts-tab-active',
                )}
                title="Contacts"
              >
                <Users className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setTimelineOpen((prev) => !prev)
                  setBillingOpen(false)
                  setContactsOpen(false)
                }}
                className={cn(
                  'todo-timeline-tab flex w-5 flex-1 items-center justify-center rounded-br-lg transition-all duration-150',
                  timelineOpen && 'todo-timeline-tab-active',
                )}
                title="Timeline"
              >
                <Clock className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
      {dropIndicator === 'below' && dropLine}
    </motion.div>
  )
}

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

  return (
    <div className="flex items-center gap-0.5">
      <div className="todo-drag-handle flex-shrink-0 p-0.5">
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <div
        className={cn(
          'group relative flex-1 overflow-visible rounded-lg px-3 py-2.5 shadow-2xl',
          isCompleted && 'opacity-50',
        )}
        style={{
          backgroundColor: 'var(--surface-2)',
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
