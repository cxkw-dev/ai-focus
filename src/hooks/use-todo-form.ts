'use client'

import * as React from 'react'
import type { Todo, Priority, Status, SubtaskInput } from '@/types/todo'
import { hasMeaningfulText, normalizeSubtaskTitle } from '@/lib/rich-text'

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
  moveSubtask: (fromIndex: number, toIndex: number) => void
  updateSubtaskTitle: (index: number, title: string) => void
  toggleSubtask: (index: number) => void
  myPrUrl: string
  setMyPrUrl: (v: string) => void
  githubPrUrls: string[]
  setGithubPrUrls: (v: string[]) => void
  addGithubPrUrl: (url: string) => void
  removeGithubPrUrl: (index: number) => void
  azureWorkItemUrl: string
  setAzureWorkItemUrl: (v: string) => void
  azureDepUrls: string[]
  setAzureDepUrls: (v: string[]) => void
  addAzureDepUrl: (url: string) => void
  removeAzureDepUrl: (index: number) => void
  reset: () => void
  toPayload: () => {
    title: string
    description?: string
    priority: Priority
    status: Status
    dueDate: string | null
    labelIds: string[]
    subtasks: SubtaskInput[]
    myPrUrl: string | null
    githubPrUrls: string[]
    azureWorkItemUrl: string | null
    azureDepUrls: string[]
  }
}

export function useTodoForm(todo?: Todo | null, options?: { initialLabelIds?: string[] }): TodoFormState {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('MEDIUM')
  const [status, setStatus] = React.useState<Status>('TODO')
  const [dueDate, setDueDate] = React.useState('')
  const [labelIds, setLabelIds] = React.useState<string[]>(options?.initialLabelIds ?? [])
  const [subtasks, setSubtasks] = React.useState<SubtaskInput[]>([])
  const [myPrUrl, setMyPrUrl] = React.useState('')
  const [githubPrUrls, setGithubPrUrls] = React.useState<string[]>([])
  const [azureWorkItemUrl, setAzureWorkItemUrl] = React.useState('')
  const [azureDepUrls, setAzureDepUrls] = React.useState<string[]>([])

  const reset = React.useCallback(() => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setStatus('TODO')
    setDueDate('')
    setLabelIds(options?.initialLabelIds ?? [])
    setSubtasks([])
    setMyPrUrl('')
    setGithubPrUrls([])
    setAzureWorkItemUrl('')
    setAzureDepUrls([])
  }, [options?.initialLabelIds])

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
    setMyPrUrl(t.myPrUrl || '')
    setGithubPrUrls(t.githubPrUrls ?? [])
    setAzureWorkItemUrl(t.azureWorkItemUrl || '')
    setAzureDepUrls(t.azureDepUrls ?? [])
  }, [])

  React.useEffect(() => {
    if (todo) {
      populateFromTodo(todo)
    } else {
      reset()
    }
  }, [todo, populateFromTodo, reset])

  const addSubtask = React.useCallback((subtaskTitle: string) => {
    const normalized = normalizeSubtaskTitle(subtaskTitle)
    if (!hasMeaningfulText(normalized)) return
    setSubtasks(prev => [...prev, { title: normalized, completed: false, order: prev.length }])
  }, [])

  const removeSubtask = React.useCallback((index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })))
  }, [])

  const moveSubtask = React.useCallback((fromIndex: number, toIndex: number) => {
    setSubtasks(prev => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev
      }
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      if (!moved) return prev
      next.splice(toIndex, 0, moved)
      return next.map((subtask, index) => ({ ...subtask, order: index }))
    })
  }, [])

  const updateSubtaskTitle = React.useCallback((index: number, newTitle: string) => {
    setSubtasks(prev => prev.map((s, i) => (i === index ? { ...s, title: newTitle } : s)))
  }, [])

  const toggleSubtask = React.useCallback((index: number) => {
    setSubtasks(prev => prev.map((s, i) => (i === index ? { ...s, completed: !s.completed } : s)))
  }, [])

  const addGithubPrUrl = React.useCallback((url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    setGithubPrUrls(prev => prev.includes(trimmed) ? prev : [...prev, trimmed])
  }, [])

  const removeGithubPrUrl = React.useCallback((index: number) => {
    setGithubPrUrls(prev => prev.filter((_, i) => i !== index))
  }, [])

  const addAzureDepUrl = React.useCallback((url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    setAzureDepUrls(prev => prev.includes(trimmed) ? prev : [...prev, trimmed])
  }, [])

  const removeAzureDepUrl = React.useCallback((index: number) => {
    setAzureDepUrls(prev => prev.filter((_, i) => i !== index))
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
    myPrUrl: myPrUrl.trim() || null,
    githubPrUrls,
    azureWorkItemUrl: azureWorkItemUrl.trim() || null,
    azureDepUrls,
  }), [title, description, priority, status, dueDate, labelIds, subtasks, myPrUrl, githubPrUrls, azureWorkItemUrl, azureDepUrls])

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
    moveSubtask,
    updateSubtaskTitle,
    toggleSubtask,
    myPrUrl, setMyPrUrl,
    githubPrUrls, setGithubPrUrls,
    addGithubPrUrl,
    removeGithubPrUrl,
    azureWorkItemUrl, setAzureWorkItemUrl,
    azureDepUrls, setAzureDepUrls,
    addAzureDepUrl,
    removeAzureDepUrl,
    reset,
    toPayload,
  }
}
