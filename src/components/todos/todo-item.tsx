'use client'

import * as React from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Trash2,
  Calendar,
  Edit2,
  GripVertical,
  RotateCcw,
  Circle,
  Play,
  Clock,
  Eye,
  Pause,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Square,
  CheckSquare,
  Plus,
  Users,
  FileText,
} from 'lucide-react'
import { cn, formatRelativeDate } from '@/lib/utils'
import { PRIORITY_MAP } from '@/lib/priority'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
import {
  cleanUrlEnd,
  ensureProtocol,
  hasMeaningfulText,
  isHtmlContent,
  linkifyHtml,
  mentionifyHtml,
  normalizeSubtaskTitle,
} from '@/lib/rich-text'
import { PrDependencyTree } from './pr-dependency-tree'
import { ContactsDrawer } from './contacts-drawer'
import { StatusUpdatesDrawer } from './status-updates-drawer'
import type { Todo, Status, Priority, Subtask, SubtaskInput } from '@/types/todo'
import type { Person } from '@/types/person'

const CHIP_BASE = 'h-5 px-1.5 rounded text-[10px] font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap'

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; colorVar: string; bgVar: string }> = {
  TODO: { label: 'To Do', icon: Circle, colorVar: 'var(--status-todo)', bgVar: 'var(--status-todo)' },
  IN_PROGRESS: { label: 'In Progress', icon: Play, colorVar: 'var(--status-in-progress)', bgVar: 'var(--status-in-progress)' },
  WAITING: { label: 'Waiting', icon: Clock, colorVar: 'var(--status-waiting)', bgVar: 'var(--status-waiting)' },
  UNDER_REVIEW: { label: 'Under Review', icon: Eye, colorVar: 'var(--status-under-review)', bgVar: 'var(--status-under-review)' },
  ON_HOLD: { label: 'On Hold', icon: Pause, colorVar: 'var(--status-on-hold)', bgVar: 'var(--status-on-hold)' },
  COMPLETED: { label: 'Done', icon: CheckCircle2, colorVar: 'var(--status-done)', bgVar: 'var(--status-done)' },
}

const CARD_OVERLAY_STATUSES = new Set<Status>(['WAITING', 'UNDER_REVIEW', 'ON_HOLD'])
const DAY_MS = 86_400_000

const PRIORITY_CONFIG: Record<Priority, { label: string; colorVar: string; bgVar: string; icon: React.ElementType; pulse?: boolean }> = Object.fromEntries(
  Object.entries(PRIORITY_MAP).map(([key, p]) => [
    key,
    { label: p.label, colorVar: p.colorVar, bgVar: p.colorVar, icon: p.icon, ...(key === 'URGENT' ? { pulse: true } : {}) },
  ])
) as Record<Priority, { label: string; colorVar: string; bgVar: string; icon: React.ElementType; pulse?: boolean }>

const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
const URL_MATCH_REGEX = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i


function renderTextWithLinks(text: string) {
  const parts = text.split(URL_SPLIT_REGEX)

  return parts.map((part, index) => {
    if (URL_MATCH_REGEX.test(part)) {
      const [cleanUrl, trailing] = cleanUrlEnd(part)
      return (
        <React.Fragment key={index}>
          <a
            href={ensureProtocol(cleanUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {cleanUrl}
          </a>
          {trailing}
        </React.Fragment>
      )
    }
    return part
  })
}

function getDaysInStatus(timestamp: string | null | undefined) {
  const parsed = timestamp ? Date.parse(timestamp) : Number.NaN
  if (Number.isNaN(parsed)) return 0
  return Math.max(0, Math.floor((Date.now() - parsed) / DAY_MS))
}

function formatStatusAge(daysInStatus: number) {
  if (daysInStatus <= 0) return 'today'
  if (daysInStatus === 1) return '1 day in status'
  return `${daysInStatus} days in status`
}

type ViewMode = 'active' | 'completed' | 'deleted'

interface TodoItemProps {
  todo: Todo
  onStatusChange: (id: string, status: Status) => void
  onPriorityChange: (id: string, priority: Priority) => void
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  onRestore?: (id: string) => void
  onToggleSubtask?: (todoId: string, subtaskId: string, completed: boolean) => void
  onUpdateSubtasks?: (todoId: string, subtasks: SubtaskInput[]) => void
  onOpenNote?: (todoId: string, noteId: string) => void
  people: Person[]
  subtaskMentions: Array<Pick<Person, 'id' | 'name' | 'email'>>
  isDragging?: boolean
  viewMode?: ViewMode
  dropIndicator?: 'above' | 'below' | null
  animateTransitions?: boolean
  compact?: boolean
}

function toSubtaskInput(subtasks: Subtask[]): SubtaskInput[] {
  return subtasks.map((subtask, index) => ({
    ...(isTemporarySubtaskId(subtask.id) ? {} : { id: subtask.id }),
    title: subtask.title,
    completed: subtask.completed,
    order: index,
  }))
}

function subtaskDndId(subtaskId: string) {
  return `subtask-${subtaskId}`
}

function createTempSubtaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `new-${crypto.randomUUID()}`
  }
  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isTemporarySubtaskId(subtaskId: string) {
  return subtaskId.startsWith('new-')
}

function SortableEditableSubtaskRow({
  subtask,
  onToggle,
  onTitleChange,
  onTitleCommit,
  onDelete,
  mentions,
}: {
  subtask: Subtask
  onToggle: () => void
  onTitleChange: (title: string) => void
  onTitleCommit: () => void
  onDelete: () => void
  mentions: { id: string; name: string; email: string }[]
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const commitFxControls = useAnimationControls()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtaskDndId(subtask.id),
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const handleCommit = React.useCallback(() => {
    onTitleCommit()
    void commitFxControls.start({
      x: [0, -1.5, 1.5, -0.75, 0],
      transition: { duration: 0.24, ease: 'easeOut' },
    })
  }, [commitFxControls, onTitleCommit])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative py-0.5"
    >
      <motion.span
        className="absolute left-0 top-1/2 h-3 w-0.5 rounded-full pointer-events-none"
        animate={
          isEditing
            ? { opacity: [0.45, 1, 0.45], scaleY: [0.75, 1, 0.75] }
            : { opacity: 0, scaleY: 0.75 }
        }
        transition={
          isEditing
            ? { duration: 1.2, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }
            : { duration: 0.12, ease: 'easeOut' }
        }
        style={{ backgroundColor: 'var(--primary)' }}
      />
      <motion.div
        className="group/subtask flex items-center rounded pl-1 pr-0.5 transition-colors hover:bg-white/5"
        animate={{
          backgroundColor: isEditing ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
          boxShadow: isEditing
            ? 'inset 0 0 0 1px color-mix(in srgb, var(--primary) 28%, transparent)'
            : 'inset 0 0 0 1px transparent',
          y: isEditing ? -0.5 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.6 }}
      >
        <motion.div className="flex items-center gap-2 w-full min-w-0" animate={commitFxControls}>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={cn(
              'flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors',
              isDragging && 'cursor-grabbing'
            )}
            style={{ color: 'var(--text-muted)', opacity: 0.7 }}
            aria-label="Reorder subtask"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="flex-shrink-0"
          >
            {subtask.completed ? (
              <CheckSquare className="h-3.5 w-3.5" style={{ color: 'var(--status-done)' }} />
            ) : (
              <Square className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <SubtaskMentionInput
              value={subtask.title}
              onChange={onTitleChange}
              onCommit={handleCommit}
              onFocusChange={setIsEditing}
              mentions={mentions}
              completed={subtask.completed}
              className={cn(
                '!text-[11px] !leading-snug',
                subtask.completed ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
              )}
              ariaLabel="Subtask title"
            />
          </div>
          <motion.span
            className="text-[9px] uppercase tracking-wide font-semibold flex-shrink-0"
            animate={{ opacity: isEditing ? 1 : 0, x: isEditing ? 0 : -2 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{ color: 'var(--primary)' }}
          >
            editing
          </motion.span>
          <button
            type="button"
            onClick={onDelete}
            className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover/subtask:opacity-60 hover:!opacity-100 transition-opacity"
            style={{ color: 'var(--destructive)' }}
            title="Delete subtask"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

function StatusDropdown({ todo, onStatusChange }: { todo: Todo; onStatusChange: (id: string, status: Status) => void }) {
  const config = STATUS_CONFIG[todo.status]
  const Icon = config.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(CHIP_BASE, 'hover:brightness-110 cursor-pointer min-w-0')}
          style={{
            backgroundColor: `color-mix(in srgb, ${config.bgVar} 15%, transparent)`,
            color: config.colorVar,
          }}
        >
          <Icon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{config.label}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[150px] p-1 border-border/50"
        style={{ backgroundColor: 'var(--surface-2)' }}
      >
        {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => {
          const statusConfig = STATUS_CONFIG[status]
          const StatusIcon = statusConfig.icon
          const isActive = todo.status === status
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => onStatusChange(todo.id, status)}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs cursor-pointer transition-colors',
                isActive ? 'font-medium' : 'hover:bg-white/5'
              )}
              style={isActive ? {
                backgroundColor: `color-mix(in srgb, ${statusConfig.bgVar} 15%, transparent)`,
                color: statusConfig.colorVar,
              } : { color: 'var(--text-muted)' }}
            >
              <StatusIcon className="h-3.5 w-3.5" style={{ color: statusConfig.colorVar }} />
              <span>{statusConfig.label}</span>
              {isActive && (
                <span className="ml-auto text-[10px] opacity-60">✓</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PriorityDropdown({ todo, onPriorityChange }: { todo: Todo; onPriorityChange: (id: string, priority: Priority) => void }) {
  const config = PRIORITY_CONFIG[todo.priority]
  const Icon = config.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            CHIP_BASE,
            'hover:brightness-110 cursor-pointer min-w-0',
          )}
          style={{
            backgroundColor: config.pulse ? config.colorVar : `color-mix(in srgb, ${config.bgVar} 15%, transparent)`,
            color: config.pulse ? 'var(--background)' : config.colorVar,
            fontWeight: config.pulse ? 700 : undefined,
          }}
        >
          <Icon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{config.label}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[130px] p-1 border-border/50"
        style={{ backgroundColor: 'var(--surface-2)' }}
      >
        {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((priority) => {
          const priorityConfig = PRIORITY_CONFIG[priority]
          const PriorityIcon = priorityConfig.icon
          const isActive = todo.priority === priority
          return (
            <DropdownMenuItem
              key={priority}
              onClick={() => onPriorityChange(todo.id, priority)}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs cursor-pointer transition-colors',
                isActive ? 'font-medium' : 'hover:bg-white/5'
              )}
              style={isActive ? {
                backgroundColor: `color-mix(in srgb, ${priorityConfig.bgVar} 15%, transparent)`,
                color: priorityConfig.colorVar,
              } : { color: 'var(--text-muted)' }}
            >
              <PriorityIcon className="h-3.5 w-3.5" style={{ color: priorityConfig.colorVar }} />
              <span>{priorityConfig.label}</span>
              {isActive && (
                <span className="ml-auto text-[10px] opacity-60">✓</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TodoStatusOverlay({ todo, compact = false }: { todo: Todo; compact?: boolean }) {
  if (!CARD_OVERLAY_STATUSES.has(todo.status)) return null

  const config = STATUS_CONFIG[todo.status]
  const daysInStatus = getDaysInStatus(todo.statusChangedAt ?? todo.createdAt)

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute z-10 flex items-center justify-center rounded-md border',
        compact ? 'inset-1' : 'inset-1.5'
      )}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--surface) 82%, transparent)',
        borderColor: `color-mix(in srgb, ${config.colorVar} 22%, transparent)`,
      }}
    >
      <div className="flex flex-col items-center gap-1 px-3 text-center">
        <span
          className={cn(
            'font-semibold uppercase leading-none',
            compact ? 'text-[11px] tracking-[0.2em]' : 'text-[13px] tracking-[0.24em]'
          )}
          style={{ color: `color-mix(in srgb, ${config.colorVar} 72%, var(--text-primary))` }}
        >
          {config.label}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 font-medium leading-none',
            compact ? 'text-[9px] tracking-[0.14em]' : 'text-[10px] tracking-[0.18em]'
          )}
          style={{ color: `color-mix(in srgb, ${config.colorVar} 52%, var(--text-muted))` }}
        >
          <Clock className="h-3 w-3" />
          {formatStatusAge(daysInStatus)}
        </span>
      </div>
    </div>
  )
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
  compact = false,
}: TodoItemProps) {
  const isCompleted = todo.status === 'COMPLETED'
  const canInlineEditSubtasks = viewMode === 'active' && !isDragging
  const [subtasks, setSubtasks] = React.useState<Subtask[]>(todo.subtasks ?? [])
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')
  const [subtasksExpanded, setSubtasksExpanded] = React.useState(false)
  const subtaskSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  React.useEffect(() => {
    setSubtasks(todo.subtasks ?? [])
  }, [todo.subtasks])

  const persistSubtasks = React.useCallback((nextSubtasks: Subtask[]) => {
    onUpdateSubtasks?.(todo.id, toSubtaskInput(nextSubtasks))
  }, [onUpdateSubtasks, todo.id])

  const handleSubtaskToggle = React.useCallback((subtaskId: string, completed: boolean) => {
    setSubtasks(prev => prev.map(subtask =>
      subtask.id === subtaskId ? { ...subtask, completed } : subtask
    ))
    onToggleSubtask?.(todo.id, subtaskId, completed)
  }, [onToggleSubtask, todo.id])

  const handleSubtaskTitleChange = React.useCallback((subtaskId: string, title: string) => {
    setSubtasks(prev => prev.map(subtask =>
      subtask.id === subtaskId ? { ...subtask, title } : subtask
    ))
  }, [])

  const handleSubtaskTitleCommit = React.useCallback((subtaskId: string) => {
    setSubtasks(prev => {
      const current = prev.find(subtask => subtask.id === subtaskId)
      if (!current) return prev

      const trimmed = normalizeSubtaskTitle(current.title)
      const original = (todo.subtasks ?? []).find(subtask => subtask.id === subtaskId)?.title ?? ''
      const originalNormalized = normalizeSubtaskTitle(original)

      if (!hasMeaningfulText(trimmed)) {
        if (current.title !== original) {
          return prev.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, title: original } : subtask
          )
        }
        return prev
      }

      if (trimmed !== current.title) {
        const normalized = prev.map(subtask =>
          subtask.id === subtaskId ? { ...subtask, title: trimmed } : subtask
        )
        if (trimmed !== originalNormalized) {
          persistSubtasks(normalized)
        }
        return normalized
      }

      if (trimmed !== originalNormalized) {
        persistSubtasks(prev)
      }

      return prev
    })
  }, [persistSubtasks, todo.subtasks])

  const handleSubtaskDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSubtasks(prev => {
      const activeIndex = prev.findIndex(subtask => subtaskDndId(subtask.id) === active.id)
      const overIndex = prev.findIndex(subtask => subtaskDndId(subtask.id) === over.id)
      if (activeIndex === -1 || overIndex === -1) return prev
      const reordered = arrayMove(prev, activeIndex, overIndex).map((subtask, index) => ({
        ...subtask,
        order: index,
      }))
      persistSubtasks(reordered)
      return reordered
    })
  }, [persistSubtasks])

  const handleSubtaskDelete = React.useCallback((subtaskId: string) => {
    setSubtasks(prev => {
      const nextSubtasks = prev
        .filter(subtask => subtask.id !== subtaskId)
        .map((subtask, index) => ({ ...subtask, order: index }))
      persistSubtasks(nextSubtasks)
      return nextSubtasks
    })
  }, [persistSubtasks])

  const handleAddSubtaskCommit = React.useCallback(() => {
    const normalized = normalizeSubtaskTitle(newSubtaskTitle)

    if (!hasMeaningfulText(normalized)) {
      setNewSubtaskTitle('')
      setIsAddingSubtask(false)
      return
    }

    setSubtasks((prev) => {
      const nextSubtasks: Subtask[] = [
        ...prev,
        {
          id: createTempSubtaskId(),
          title: normalized,
          completed: false,
          order: prev.length,
        },
      ]
      persistSubtasks(nextSubtasks)
      return nextSubtasks
    })

    setNewSubtaskTitle('')
    setIsAddingSubtask(false)
  }, [newSubtaskTitle, persistSubtasks])

  const completedCount = subtasks.filter(s => s.completed).length
  const allDone = subtasks.length > 0 && completedCount === subtasks.length
  const hasIntegrations = (todo.myPrUrls ?? []).length > 0 || (todo.githubPrUrls ?? []).length > 0 || !!todo.azureWorkItemUrl || (todo.azureDepUrls ?? []).length > 0 || (todo.myIssueUrls ?? []).length > 0 || (todo.githubIssueUrls ?? []).length > 0
  const hasSubtasks = subtasks.length > 0
  const canAddSubtasks = canInlineEditSubtasks && !!onUpdateSubtasks
  const shouldShowSubtasks = hasSubtasks || canAddSubtasks || isAddingSubtask

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex items-start gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 mb-2">
                {viewMode === 'active' && (
                  <StatusDropdown todo={todo} onStatusChange={onStatusChange} />
                )}
                {viewMode === 'completed' && (() => {
                  const config = STATUS_CONFIG[todo.status]
                  const Icon = config.icon
                  return (
                    <span
                      className={cn(CHIP_BASE, 'min-w-0')}
                      style={{
                        backgroundColor: `color-mix(in srgb, ${config.bgVar} 15%, transparent)`,
                        color: config.colorVar,
                      }}
                    >
                      <Icon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{config.label}</span>
                    </span>
                  )
                })()}
                {viewMode === 'active' ? (
                  <PriorityDropdown todo={todo} onPriorityChange={onPriorityChange} />
                ) : (
                  <span
                    className={cn(CHIP_BASE)}
                    style={{
                      backgroundColor: PRIORITY_CONFIG[todo.priority].pulse ? PRIORITY_CONFIG[todo.priority].colorVar : `color-mix(in srgb, ${PRIORITY_CONFIG[todo.priority].bgVar} 15%, transparent)`,
                      color: PRIORITY_CONFIG[todo.priority].pulse ? 'var(--background)' : PRIORITY_CONFIG[todo.priority].colorVar,
                      fontWeight: PRIORITY_CONFIG[todo.priority].pulse ? 700 : undefined,
                    }}
                  >
                    {PRIORITY_CONFIG[todo.priority].label}
                  </span>
                )}
                {todo.labels?.map((label) => (
                  <span
                    key={label.id}
                    className={cn(CHIP_BASE, 'font-semibold max-w-[8rem] truncate')}
                    style={{
                      backgroundColor: `color-mix(in srgb, ${label.color} 15%, transparent)`,
                      color: label.color,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {(viewMode === 'active' || viewMode === 'completed') && (
                <>
                  {todo.notebookNoteId && (
                    <button
                      onClick={() => onOpenNote?.(todo.id, todo.notebookNoteId!)}
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
                className="text-[11px] font-mono font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                #{todo.taskNumber}
              </span>
            </div>
          </div>

          <div
            className={cn('relative rounded-md', compact ? 'px-2 py-1.5' : 'px-2.5 py-2')}
            style={{ backgroundColor: 'color-mix(in srgb, var(--background) 50%, transparent)' }}
          >
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  'text-[13px] font-medium break-words leading-snug',
                  isCompleted && 'line-through'
                )}
                style={{ color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)' }}
              >
                {renderTextWithLinks(todo.title)}
              </h3>
              {compact && subtasks.length > 0 && (
                <span
                  className="text-[10px] font-medium inline-flex items-center gap-0.5 flex-shrink-0"
                  style={{ color: allDone ? 'var(--status-done)' : 'var(--text-muted)' }}
                >
                  {completedCount}/{subtasks.length}
                  <CheckSquare className="h-2.5 w-2.5" />
                </span>
              )}
              {todo.dueDate && (
                <span
                  className="text-[10px] inline-flex items-center gap-1 flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Calendar className="h-2.5 w-2.5" />
                  {formatRelativeDate(todo.dueDate)}
                </span>
              )}
            </div>
            {!compact && todo.description && (
              todo.description.startsWith('<') ? (
                <div
                  className="mt-1.5 max-h-48 overflow-y-auto break-words rich-text-display"
                  dangerouslySetInnerHTML={{ __html: linkifyHtml(mentionifyHtml(todo.description)) }}
                />
              ) : (
                <p
                  className="mt-1.5 max-h-48 overflow-y-auto text-[11px] break-words leading-snug whitespace-pre-wrap"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {renderTextWithLinks(todo.description)}
                </p>
              )
            )}
            <TodoStatusOverlay todo={todo} compact={compact} />
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

      {/* Subtasks */}
      {!compact && shouldShowSubtasks && (
        <div
          className="pt-1.5"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <button
              type="button"
              onClick={() => setSubtasksExpanded(prev => !prev)}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {subtasksExpanded ? (
                <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
              ) : (
                <ChevronRight className="h-3 w-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
              )}
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                Subtasks
              </span>
            </button>
            {hasSubtasks && (
              <span
                className="text-[10px] font-medium"
                style={{ color: allDone ? 'var(--status-done)' : 'var(--text-muted)' }}
              >
                {completedCount}/{subtasks.length}
              </span>
            )}
            {canAddSubtasks && !isAddingSubtask && subtasksExpanded && (
              <button
                type="button"
                onClick={() => setIsAddingSubtask(true)}
                className="ml-auto inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-muted)' }}
              >
                <Plus className="h-2.5 w-2.5" />
                Add
              </button>
            )}
          </div>
          {subtasksExpanded && (
            <>
              {hasSubtasks && (
                canInlineEditSubtasks ? (
                  <DndContext
                    sensors={subtaskSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSubtaskDragEnd}
                  >
                    <SortableContext
                      items={subtasks.map(subtask => subtaskDndId(subtask.id))}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-0.5">
                        {subtasks.map((subtask) => (
                          <SortableEditableSubtaskRow
                            key={subtask.id}
                            subtask={subtask}
                            onToggle={() => handleSubtaskToggle(subtask.id, !subtask.completed)}
                            onTitleChange={(title) => handleSubtaskTitleChange(subtask.id, title)}
                            onTitleCommit={() => handleSubtaskTitleCommit(subtask.id)}
                            onDelete={() => handleSubtaskDelete(subtask.id)}
                            mentions={subtaskMentions}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="space-y-0.5">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 w-full text-left py-0.5 px-0.5 rounded"
                      >
                        {subtask.completed ? (
                          <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--status-done)' }} />
                        ) : (
                          <Square className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                        )}
                        <div
                          className="text-[11px] leading-snug"
                          style={{
                            color: subtask.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: subtask.completed ? 'line-through' : 'none',
                          }}
                        >
                          {isHtmlContent(subtask.title) ? (
                            <div
                              className="[&_p]:my-0 [&_p]:leading-snug [&_.mention]:font-medium [&_.mention:hover]:underline [&_a]:text-[var(--primary)] [&_a:hover]:underline"
                              dangerouslySetInnerHTML={{ __html: linkifyHtml(mentionifyHtml(subtask.title)) }}
                            />
                          ) : (
                            subtask.title
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
              {canAddSubtasks && isAddingSubtask && (
                <div className="mt-1 rounded px-1 py-0.5" style={{ backgroundColor: 'color-mix(in srgb, var(--surface) 45%, transparent)' }}>
                  <div className="flex items-center gap-1.5">
                    <Plus className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <SubtaskMentionInput
                      value={newSubtaskTitle}
                      onChange={setNewSubtaskTitle}
                      onCommit={handleAddSubtaskCommit}
                      commitOnBlur={false}
                      mentions={subtaskMentions}
                      placeholder="Add a subtask..."
                      className="!text-[11px] !leading-snug text-[var(--text-primary)]"
                      ariaLabel="New subtask title"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
  compact = false,
}: TodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: viewMode !== 'active' })

  const [contactsOpen, setContactsOpen] = React.useState(false)
  const [timelineOpen, setTimelineOpen] = React.useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragging = isOverlay || isDragging
  const isCompleted = todo.status === 'COMPLETED'

  const dropLine = (
    <div
      className="h-0.5 rounded-full mx-1 transition-all"
      style={{ backgroundColor: 'var(--primary)' }}
    />
  )

  return (
      <motion.div
        ref={setNodeRef}
        style={style}
        layout={animateTransitions && !dragging}
        initial={animateTransitions ? { opacity: 0, y: 8 } : false}
        animate={animateTransitions ? { opacity: dragging ? 0.5 : 1, y: 0 } : { opacity: dragging ? 0.5 : 1 }}
        exit={animateTransitions ? { opacity: 0, x: -12, transition: { duration: 0.16 } } : { opacity: 0 }}
        transition={animateTransitions ? { duration: 0.16, ease: 'easeOut' } : { duration: 0.01 }}
        className="min-w-0"
      >
      {dropIndicator === 'above' && dropLine}
      <div className="flex items-center gap-0.5">
      {/* Reserve a consistent gutter so the card body stays aligned across filters */}
      <div className="flex w-[18px] flex-shrink-0 justify-center">
        {viewMode === 'active' && (
          <button
            {...attributes}
            {...listeners}
            className={cn(
              'todo-drag-handle cursor-grab touch-none p-0.5 rounded transition-colors self-center',
              dragging && 'cursor-grabbing'
            )}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Card */}
      <div
        className={cn(
          'group flex-1 min-w-0 transition-all duration-150 todo-card relative overflow-visible',
          compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5',
          dragging ? 'rounded-lg' : 'rounded-l-lg',
          dragging && 'shadow-lg z-50',
          (isCompleted || viewMode !== 'active') && 'opacity-50'
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
          compact={compact}
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
        <div className="flex flex-col flex-shrink-0 self-stretch rounded-r-lg overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); setContactsOpen(prev => !prev); setTimelineOpen(false) }}
            className={cn(
              'todo-contacts-tab flex-1 w-5 flex items-center justify-center transition-all duration-150',
              contactsOpen && 'todo-contacts-tab-active'
            )}
            title="Contacts"
          >
            <Users className="h-3 w-3" />
          </button>
          <div className="w-2.5 mx-auto" style={{ height: '0.5px', backgroundColor: 'var(--border-color)' }} />
          <button
            onClick={(e) => { e.stopPropagation(); setTimelineOpen(prev => !prev); setContactsOpen(false) }}
            className={cn(
              'todo-timeline-tab flex-1 w-5 flex items-center justify-center transition-all duration-150',
              timelineOpen && 'todo-timeline-tab-active'
            )}
            title="Timeline"
          >
            <Clock className="h-3 w-3" />
          </button>
        </div>
      )}
      </div>
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
  compact = false,
}: Omit<TodoItemProps, 'isDragging' | 'viewMode' | 'dropIndicator'>) {
  const isCompleted = todo.status === 'COMPLETED'

  return (
    <div className="flex items-center gap-0.5">
      <div
        className="flex-shrink-0 p-0.5 todo-drag-handle"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <div
        className={cn(
          'group relative flex-1 rounded-lg shadow-2xl overflow-visible',
          compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5',
          isCompleted && 'opacity-50'
        )}
        style={{
          backgroundColor: 'var(--surface-2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent)',
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
          compact={compact}
        />
      </div>
    </div>
  )
}
