'use client'

import * as React from 'react'
import type { Todo, Priority, Status } from '@/types/todo'

interface TodoFormState {
  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  priority: Priority
  setPriority: (v: Priority) => void
  status: Status
  setStatus: (v: Status) => void
  dueDate: string
  setDueDate: (v: string) => void
  categoryId: string
  setCategoryId: (v: string) => void
  labelIds: string[]
  setLabelIds: (v: string[]) => void
  reset: () => void
  toPayload: () => {
    title: string
    description?: string
    priority: Priority
    status: Status
    dueDate: string | null
    categoryId: string | null
    labelIds: string[]
  }
}

export function useTodoForm(todo?: Todo | null): TodoFormState {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('MEDIUM')
  const [status, setStatus] = React.useState<Status>('TODO')
  const [dueDate, setDueDate] = React.useState('')
  const [categoryId, setCategoryId] = React.useState<string>('')
  const [labelIds, setLabelIds] = React.useState<string[]>([])

  const reset = React.useCallback(() => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setStatus('TODO')
    setDueDate('')
    setCategoryId('')
    setLabelIds([])
  }, [])

  const populateFromTodo = React.useCallback((t: Todo) => {
    setTitle(t.title)
    setDescription(t.description || '')
    setPriority(t.priority)
    setStatus(t.status)
    setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '')
    setCategoryId(t.categoryId || '')
    setLabelIds(t.labels?.map(l => l.id) ?? [])
  }, [])

  React.useEffect(() => {
    if (todo) {
      populateFromTodo(todo)
    } else {
      reset()
    }
  }, [todo, populateFromTodo, reset])

  const toPayload = React.useCallback(() => ({
    title: title.trim(),
    description: description.trim() || undefined,
    priority,
    status,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    categoryId: categoryId || null,
    labelIds,
  }), [title, description, priority, status, dueDate, categoryId, labelIds])

  return {
    title, setTitle,
    description, setDescription,
    priority, setPriority,
    status, setStatus,
    dueDate, setDueDate,
    categoryId, setCategoryId,
    labelIds, setLabelIds,
    reset,
    toPayload,
  }
}
