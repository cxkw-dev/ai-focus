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
  myPrUrls: string[]
  setMyPrUrls: (v: string[]) => void
  addMyPrUrl: (url: string) => void
  removeMyPrUrl: (index: number) => void
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
  myIssueUrls: string[]
  setMyIssueUrls: (v: string[]) => void
  addMyIssueUrl: (url: string) => void
  removeMyIssueUrl: (index: number) => void
  githubIssueUrls: string[]
  setGithubIssueUrls: (v: string[]) => void
  addGithubIssueUrl: (url: string) => void
  removeGithubIssueUrl: (index: number) => void
  reset: () => void
  toPayload: () => {
    title: string
    description?: string
    priority: Priority
    status: Status
    dueDate: string | null
    labelIds: string[]
    subtasks: SubtaskInput[]
    myPrUrls: string[]
    githubPrUrls: string[]
    azureWorkItemUrl: string | null
    azureDepUrls: string[]
    myIssueUrls: string[]
    githubIssueUrls: string[]
  }
}

export function useTodoForm(
  todo?: Todo | null,
  options?: { initialLabelIds?: string[] },
): TodoFormState {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('MEDIUM')
  const [status, setStatus] = React.useState<Status>('TODO')
  const [dueDate, setDueDate] = React.useState('')
  const [labelIds, setLabelIds] = React.useState<string[]>(
    options?.initialLabelIds ?? [],
  )
  const [subtasks, setSubtasks] = React.useState<SubtaskInput[]>([])
  const [myPrUrls, setMyPrUrls] = React.useState<string[]>([])
  const [githubPrUrls, setGithubPrUrls] = React.useState<string[]>([])
  const [azureWorkItemUrl, setAzureWorkItemUrl] = React.useState('')
  const [azureDepUrls, setAzureDepUrls] = React.useState<string[]>([])
  const [myIssueUrls, setMyIssueUrls] = React.useState<string[]>([])
  const [githubIssueUrls, setGithubIssueUrls] = React.useState<string[]>([])

  const reset = React.useCallback(() => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setStatus('TODO')
    setDueDate('')
    setLabelIds(options?.initialLabelIds ?? [])
    setSubtasks([])
    setMyPrUrls([])
    setGithubPrUrls([])
    setAzureWorkItemUrl('')
    setAzureDepUrls([])
    setMyIssueUrls([])
    setGithubIssueUrls([])
  }, [options?.initialLabelIds])

  const populateFromTodo = React.useCallback((t: Todo) => {
    setTitle(t.title)
    setDescription(t.description || '')
    setPriority(t.priority)
    setStatus(t.status)
    setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '')
    setLabelIds(t.labels?.map((l) => l.id) ?? [])
    setSubtasks(
      t.subtasks?.map((s) => ({
        id: s.id,
        title: s.title,
        completed: s.completed,
        order: s.order,
      })) ?? [],
    )
    setMyPrUrls(t.myPrUrls ?? [])
    setGithubPrUrls(t.githubPrUrls ?? [])
    setAzureWorkItemUrl(t.azureWorkItemUrl || '')
    setAzureDepUrls(t.azureDepUrls ?? [])
    setMyIssueUrls(t.myIssueUrls ?? [])
    setGithubIssueUrls(t.githubIssueUrls ?? [])
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
    setSubtasks((prev) => [
      ...prev,
      { title: normalized, completed: false, order: prev.length },
    ])
  }, [])

  const removeSubtask = React.useCallback((index: number) => {
    setSubtasks((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
    )
  }, [])

  const moveSubtask = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      setSubtasks((prev) => {
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex >= prev.length
        ) {
          return prev
        }
        const next = [...prev]
        const [moved] = next.splice(fromIndex, 1)
        if (!moved) return prev
        next.splice(toIndex, 0, moved)
        return next.map((subtask, index) => ({ ...subtask, order: index }))
      })
    },
    [],
  )

  const updateSubtaskTitle = React.useCallback(
    (index: number, newTitle: string) => {
      setSubtasks((prev) =>
        prev.map((s, i) => (i === index ? { ...s, title: newTitle } : s)),
      )
    },
    [],
  )

  const toggleSubtask = React.useCallback((index: number) => {
    setSubtasks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, completed: !s.completed } : s)),
    )
  }, [])

  const addMyPrUrl = React.useCallback((url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    setMyPrUrls((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
  }, [])

  const removeMyPrUrl = React.useCallback((index: number) => {
    setMyPrUrls((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addGithubPrUrl = React.useCallback((url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    setGithubPrUrls((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed],
    )
  }, [])

  const removeGithubPrUrl = React.useCallback((index: number) => {
    setGithubPrUrls((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addAzureDepUrl = React.useCallback((url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    setAzureDepUrls((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed],
    )
  }, [])

  const removeAzureDepUrl = React.useCallback((index: number) => {
    setAzureDepUrls((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addMyIssueUrl = React.useCallback((url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    setMyIssueUrls((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed],
    )
  }, [])

  const removeMyIssueUrl = React.useCallback((index: number) => {
    setMyIssueUrls((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addGithubIssueUrl = React.useCallback((url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    setGithubIssueUrls((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed],
    )
  }, [])

  const removeGithubIssueUrl = React.useCallback((index: number) => {
    setGithubIssueUrls((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const toPayload = React.useCallback(
    () => ({
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
      myPrUrls,
      githubPrUrls,
      azureWorkItemUrl: azureWorkItemUrl.trim() || null,
      azureDepUrls,
      myIssueUrls,
      githubIssueUrls,
    }),
    [
      title,
      description,
      priority,
      status,
      dueDate,
      labelIds,
      subtasks,
      myPrUrls,
      githubPrUrls,
      azureWorkItemUrl,
      azureDepUrls,
      myIssueUrls,
      githubIssueUrls,
    ],
  )

  return {
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    status,
    setStatus,
    dueDate,
    setDueDate,
    labelIds,
    setLabelIds,
    subtasks,
    addSubtask,
    removeSubtask,
    moveSubtask,
    updateSubtaskTitle,
    toggleSubtask,
    myPrUrls,
    setMyPrUrls,
    addMyPrUrl,
    removeMyPrUrl,
    githubPrUrls,
    setGithubPrUrls,
    addGithubPrUrl,
    removeGithubPrUrl,
    azureWorkItemUrl,
    setAzureWorkItemUrl,
    azureDepUrls,
    setAzureDepUrls,
    addAzureDepUrl,
    removeAzureDepUrl,
    myIssueUrls,
    setMyIssueUrls,
    addMyIssueUrl,
    removeMyIssueUrl,
    githubIssueUrls,
    setGithubIssueUrls,
    addGithubIssueUrl,
    removeGithubIssueUrl,
    reset,
    toPayload,
  }
}
