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
  Circle,
  Play,
  Clock,
  Pause,
  CheckCircle2,
  ChevronDown,
  AlertTriangle,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeDate } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Todo, Status, Priority } from '@/types/todo'

// Unified chip styling - all elements in the bottom row share this base
const CHIP_BASE = 'h-5 px-1.5 rounded text-[10px] font-medium inline-flex items-center gap-1 transition-colors'

// Uses CSS variables from globals.css for easy theme switching
const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; colorVar: string; bgVar: string }> = {
  TODO: { label: 'To Do', icon: Circle, colorVar: 'var(--status-todo)', bgVar: 'var(--status-todo)' },
  IN_PROGRESS: { label: 'In Progress', icon: Play, colorVar: 'var(--status-in-progress)', bgVar: 'var(--status-in-progress)' },
  WAITING: { label: 'Waiting', icon: Clock, colorVar: 'var(--status-waiting)', bgVar: 'var(--status-waiting)' },
  ON_HOLD: { label: 'On Hold', icon: Pause, colorVar: 'var(--status-on-hold)', bgVar: 'var(--status-on-hold)' },
  COMPLETED: { label: 'Done', icon: CheckCircle2, colorVar: 'var(--status-done)', bgVar: 'var(--status-done)' },
}

const PRIORITY_CONFIG: Record<Priority, { label: string; colorVar: string; bgVar: string; icon?: React.ElementType; pulse?: boolean }> = {
  LOW: { label: 'Low', colorVar: 'var(--priority-low)', bgVar: 'var(--priority-low)' },
  MEDIUM: { label: 'Med', colorVar: 'var(--priority-medium)', bgVar: 'var(--priority-medium)' },
  HIGH: { label: 'High', colorVar: 'var(--priority-high)', bgVar: 'var(--priority-high)', icon: AlertTriangle },
  URGENT: { label: 'Urgent', colorVar: 'var(--priority-urgent)', bgVar: 'var(--priority-urgent)', icon: Flame, pulse: true },
}

const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+)/g
const URL_MATCH_REGEX = /^https?:\/\/[^\s]+$/

function renderTextWithLinks(text: string) {
  const parts = text.split(URL_SPLIT_REGEX)

  return parts.map((part, index) => {
    if (URL_MATCH_REGEX.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      )
    }
    return part
  })
}

interface TodoItemProps {
  todo: Todo
  onStatusChange: (id: string, status: Status) => void
  onPriorityChange: (id: string, priority: Priority) => void
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  onRestore?: (id: string) => void
  isDragging?: boolean
  isArchiveView?: boolean
}

function StatusDropdown({ todo, onStatusChange }: { todo: Todo; onStatusChange: (id: string, status: Status) => void }) {
  const config = STATUS_CONFIG[todo.status]
  const Icon = config.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(CHIP_BASE, 'hover:brightness-110 cursor-pointer')}
          style={{
            backgroundColor: `color-mix(in srgb, ${config.bgVar} 15%, transparent)`,
            color: config.colorVar,
          }}
        >
          <Icon className="h-3 w-3" />
          <span className="hidden sm:inline">{config.label}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
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
            config.pulse && 'animate-pulse',
            'hover:brightness-110 cursor-pointer'
          )}
          style={{
            backgroundColor: `color-mix(in srgb, ${config.bgVar} 15%, transparent)`,
            color: config.colorVar,
          }}
        >
          {Icon && <Icon className="h-3 w-3" />}
          <span>{config.label}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
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
              {PriorityIcon ? (
                <PriorityIcon className="h-3.5 w-3.5" style={{ color: priorityConfig.colorVar }} />
              ) : (
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: priorityConfig.colorVar }} />
              )}
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

function TodoItemContent({
  todo,
  onStatusChange,
  onPriorityChange,
  onDelete,
  onEdit,
  onRestore,
  isDragging,
  isArchiveView,
}: TodoItemProps) {
  const isCompleted = todo.status === 'COMPLETED'

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      {/* Main row: content */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
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

          {todo.description && (
            todo.description.startsWith('<') ? (
              <div
                className="mt-0.5 break-words rich-text-display"
                dangerouslySetInnerHTML={{ __html: todo.description }}
              />
            ) : (
              <p
                className="mt-0.5 text-[11px] break-words leading-snug whitespace-pre-wrap"
                style={{ color: 'var(--text-muted)' }}
              >
                {renderTextWithLinks(todo.description)}
              </p>
            )
          )}
        </div>
      </div>

      {/* Bottom row: actions aligned */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {!isArchiveView && (
            <StatusDropdown todo={todo} onStatusChange={onStatusChange} />
          )}
          {!isArchiveView ? (
            <PriorityDropdown todo={todo} onPriorityChange={onPriorityChange} />
          ) : (
            <span
              className={cn(CHIP_BASE)}
              style={{
                backgroundColor: `color-mix(in srgb, ${PRIORITY_CONFIG[todo.priority].bgVar} 15%, transparent)`,
                color: PRIORITY_CONFIG[todo.priority].colorVar,
              }}
            >
              {PRIORITY_CONFIG[todo.priority].label}
            </span>
          )}
          {todo.category && (
            <span
              className={cn(CHIP_BASE)}
              style={{
                backgroundColor: `${todo.category.color}15`,
                color: todo.category.color
              }}
            >
              {todo.category.name}
            </span>
          )}
        </div>

        {/* Actions - same height as chips */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isArchiveView ? (
            <>
              <button
                onClick={() => onRestore?.(todo.id)}
                className={cn(CHIP_BASE, 'transition-colors')}
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                  color: 'var(--primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--primary) 25%, transparent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--primary) 15%, transparent)'
                }}
                title="Restore"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className={cn(CHIP_BASE, 'transition-colors')}
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--destructive) 15%, transparent)',
                  color: 'var(--destructive)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--destructive) 25%, transparent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--destructive) 15%, transparent)'
                }}
                title="Delete permanently"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(todo)}
                className={cn(CHIP_BASE, 'transition-colors')}
                style={{
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--primary) 20%, transparent)'
                  e.currentTarget.style.color = 'var(--primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-2)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
                title="Edit"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className={cn(CHIP_BASE, 'transition-colors')}
                style={{
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--destructive) 15%, transparent)'
                  e.currentTarget.style.color = 'var(--destructive)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-2)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function TodoItem({ todo, onStatusChange, onPriorityChange, onDelete, onEdit, onRestore, isDragging: isOverlay, isArchiveView }: TodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: isArchiveView })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragging = isOverlay || isDragging
  const isCompleted = todo.status === 'COMPLETED'

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!dragging}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: dragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      className="flex items-center gap-0.5"
    >
      {/* Drag Handle */}
      {!isArchiveView && (
        <button
          {...attributes}
          {...listeners}
          className={cn(
            'flex-shrink-0 cursor-grab touch-none p-0.5 rounded transition-colors self-center',
            dragging && 'cursor-grabbing'
          )}
          style={{ color: 'color-mix(in srgb, var(--text-muted) 40%, transparent)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'color-mix(in srgb, var(--text-muted) 40%, transparent)'
          }}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Card */}
      <div
        className={cn(
          'group flex-1 rounded-lg px-3 py-2.5 transition-all',
          dragging && 'shadow-lg z-50',
          (isCompleted || isArchiveView) && 'opacity-50'
        )}
        style={{
          backgroundColor: 'var(--surface-2)',
          ...(dragging ? { boxShadow: '0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent)' } : {}),
        }}
      >
        <TodoItemContent
          todo={todo}
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
          onDelete={onDelete}
          onEdit={onEdit}
          onRestore={onRestore}
          isDragging={dragging}
          isArchiveView={isArchiveView}
        />
      </div>
    </motion.div>
  )
}

export function TodoItemOverlay({ todo, onStatusChange, onPriorityChange, onDelete, onEdit }: Omit<TodoItemProps, 'isDragging' | 'isArchiveView'>) {
  const isCompleted = todo.status === 'COMPLETED'

  return (
    <div className="flex items-center gap-0.5">
      <div
        className="flex-shrink-0 p-0.5"
        style={{ color: 'color-mix(in srgb, var(--text-muted) 40%, transparent)' }}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <div
        className={cn(
          'group flex-1 rounded-lg px-3 py-2.5 shadow-2xl',
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
          isDragging={true}
        />
      </div>
    </div>
  )
}
