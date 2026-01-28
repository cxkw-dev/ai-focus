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
  Check,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeDate } from '@/lib/utils'
import { PriorityBadge } from './priority-badge'
import type { Todo } from '@/types/todo'

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
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  onRestore?: (id: string) => void
  isDragging?: boolean
  isArchiveView?: boolean
}

function TodoItemContent({
  todo,
  onToggle,
  onDelete,
  onEdit,
  onRestore,
  isDragging,
  isArchiveView,
}: TodoItemProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      {/* Main row: content */}
      <div className="flex items-start gap-2">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'text-[13px] font-medium text-foreground break-words leading-snug',
              todo.completed && 'line-through text-muted-foreground'
            )}
          >
            {renderTextWithLinks(todo.title)}
          </h3>

          {todo.description && (
            <p className="mt-0.5 text-[11px] text-muted-foreground break-words leading-snug">
              {renderTextWithLinks(todo.description)}
            </p>
          )}
        </div>
      </div>

      {/* Bottom row: chips left, actions right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={todo.priority} size="sm" />
          {todo.category && (
            <span
              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${todo.category.color}15`, color: todo.category.color }}
            >
              {todo.category.name}
            </span>
          )}
          {todo.dueDate && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              {formatRelativeDate(todo.dueDate)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {isArchiveView ? (
            <>
              <button
                onClick={() => onRestore?.(todo.id)}
                className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all duration-150"
                title="Restore"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className="p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95 transition-all duration-150"
                title="Delete permanently"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onToggle(todo.id, !todo.completed)}
                className={cn(
                  'p-1.5 rounded-full active:scale-95 transition-all duration-150',
                  todo.completed
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-accent/50 text-accent-foreground hover:bg-accent'
                )}
                title={todo.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {todo.completed ? (
                  <Undo2 className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </button>
              <button
                onClick={() => onEdit(todo)}
                className="p-1.5 rounded-full bg-[#E39A7B]/15 text-[#E39A7B] hover:bg-[#E39A7B]/25 active:scale-95 transition-all duration-150"
                title="Edit"
              >
                <Edit2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className="p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95 transition-all duration-150"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function TodoItem({ todo, onToggle, onDelete, onEdit, onRestore, isDragging: isOverlay, isArchiveView }: TodoItemProps) {
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
      {/* Drag Handle - outside card, centered */}
      {!isArchiveView && (
        <button
          {...attributes}
          {...listeners}
          className={cn(
            'flex-shrink-0 cursor-grab touch-none p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors self-center',
            dragging && 'cursor-grabbing'
          )}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Card */}
      <div
        className={cn(
          'group flex-1 rounded-lg border bg-card px-3 py-2 transition-all hover:shadow-sm',
          todo.completed && 'opacity-60 bg-muted/30',
          dragging && 'shadow-lg ring-2 ring-[#E39A7B]/30 z-50',
          isArchiveView && 'opacity-70'
        )}
      >
        <TodoItemContent
          todo={todo}
          onToggle={onToggle}
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



export function TodoItemOverlay({ todo, onToggle, onDelete, onEdit }: Omit<TodoItemProps, 'isDragging' | 'isArchiveView'>) {
  return (
    <div className="flex items-center gap-0.5">
      {/* Drag Handle placeholder for overlay */}
      <div className="flex-shrink-0 p-0.5 text-muted-foreground/40">
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Card */}
      <div
        className={cn(
          'group flex-1 rounded-lg border bg-card px-3 py-2 shadow-2xl ring-2 ring-[#E39A7B]/30',
          todo.completed && 'opacity-60'
        )}
      >
        <TodoItemContent
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          isDragging={true}
        />
      </div>
    </div>
  )
}
