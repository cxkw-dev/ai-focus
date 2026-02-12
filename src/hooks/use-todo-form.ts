'use client'

import * as React from 'react'
import type { Todo, Priority, Status, SubtaskInput } from '@/types/todo'

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
  labelIds: string[]
  setLabelIds: (v: string[]) => void
  subtasks: SubtaskInput[]
  addSubtask: (title: string) => void
  removeSubtask: (index: number) => void
  updateSubtaskTitle: (index: number, title: string) => void
  toggleSubtask: (index: number) => void
  reset: () => void
  toPayload: () => {
    title: string
    description?: string
    priority: Priority
    status: Status
    dueDate: string | null
    labelIds: string[]
    subtasks: SubtaskInput[]
  }
}

export function useTodoForm(todo?: Todo | null): TodoFormState {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('MEDIUM')
  const [status, setStatus] = React.useState<Status>('TODO')
  const [dueDate, setDueDate] = React.useState('')
  const [labelIds, setLabelIds] = React.useState<string[]>([])
  const [subtasks, setSubtasks] = React.useState<SubtaskInput[]>([])

  const reset = React.useCallback(() => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setStatus('TODO')
    setDueDate('')
    setLabelIds([])
    setSubtasks([])
  }, [])

  const populateFromTodo = React.useCallback((t: Todo) => {
    setTitle(t.title)
    setDescription(t.description || '')
    setPriority(t.priority)
    setStatus(t.status)
    setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '')
    setLabelIds(t.labels?.map(l => l.id) ?? [])
    setSubtasks(
      t.subtasks?.map(s => ({ id: s.id, title: s.title, completed: s.completed, order: s.order })) ?? []
    )
  }, [])

  React.useEffect(() => {
    if (todo) {
      populateFromTodo(todo)
    } else {
      reset()
    }
  }, [todo, populateFromTodo, reset])

  const addSubtask = React.useCallback((subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return
    setSubtasks(prev => [...prev, { title: subtaskTitle.trim(), completed: false, order: prev.length }])
  }, [])

  const removeSubtask = React.useCallback((index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })))
  }, [])

  const updateSubtaskTitle = React.useCallback((index: number, newTitle: string) => {
    setSubtasks(prev => prev.map((s, i) => (i === index ? { ...s, title: newTitle } : s)))
  }, [])

  const toggleSubtask = React.useCallback((index: number) => {
    setSubtasks(prev => prev.map((s, i) => (i === index ? { ...s, completed: !s.completed } : s)))
  }, [])

  const toPayload = React.useCallback(() => ({
    title: title.trim(),
    description: description.trim() || undefined,
    priority,
    status,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    labelIds,
    subtasks: subtasks.map((s, i) => ({
      ...(s.id ? { id: s.id } : {}),
      title: s.title,
      completed: s.completed ?? false,
      order: i,
    })),
  }), [title, description, priority, status, dueDate, labelIds, subtasks])

  return {
    title, setTitle,
    description, setDescription,
    priority, setPriority,
    status, setStatus,
    dueDate, setDueDate,
    labelIds, setLabelIds,
    subtasks,
    addSubtask,
    removeSubtask,
    updateSubtaskTitle,
    toggleSubtask,
    reset,
    toPayload,
  }
}
