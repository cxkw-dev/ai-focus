'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  LayoutGrid,
  Trash2,
} from 'lucide-react'
import { HeaderActions } from '@/components/layout/header-actions-context'
import { ProjectBoard } from '@/components/todos/project-board'
import { TodoItem } from '@/components/todos/todo-item'
import { TodoDialogs } from '@/components/todos/todo-dialogs'
import { useLabels } from '@/hooks/use-labels'
import { usePeople } from '@/hooks/use-people'
import { useTerminalLaneExpansion } from '@/hooks/use-board-lanes'
import { useProjectBoard } from '@/hooks/use-project-board'
import { useTodoActions } from '@/hooks/use-todo-actions'
import { useTodoNoteDrawer } from '@/hooks/use-todo-note-drawer'
import {
  BOARD_COLUMN_KEYS,
  BOARD_COLUMNS,
  statusForBoardColumn,
  type BoardColumnKey,
} from '@/lib/board-columns'
import { PROJECTS_ROUTE, findProject } from '@/lib/projects'

type ProjectView = 'board' | 'trash'

export default function ProjectPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const {
    labels,
    archivedLabels,
    isLoading: labelsLoading,
    handleDelete: handleArchiveProject,
    handleRestore: handleRestoreProject,
    isMutating: isProjectMutating,
  } = useLabels()
  const { people } = usePeople()
  const { expandedLanes, setLaneExpanded, anyExpanded } =
    useTerminalLaneExpansion()
  const actions = useTodoActions({ withCompleted: anyExpanded })
  const [view, setView] = React.useState<ProjectView>('board')

  const noteDrawer = useTodoNoteDrawer({
    todos: actions.todos,
    completedTodos: actions.completedTodos,
    deletedTodos: actions.deletedTodos,
  })

  const { columns, groups, projectDeletedTodos, activeCount, doneCount } =
    useProjectBoard({
      projectId,
      todos: actions.todos,
      completedTodos: actions.completedTodos,
      completedCounts: actions.completedCounts,
      deletedTodos: actions.deletedTodos,
    })

  const subtaskMentions = React.useMemo(
    () =>
      people.map((person) => ({
        id: person.id,
        name: person.name,
        email: person.email,
      })),
    [people],
  )

  const project = findProject([...labels, ...archivedLabels], projectId)

  const handleMoveToColumn = React.useCallback(
    (todoId: string, columnKey: BoardColumnKey) => {
      const todo = BOARD_COLUMN_KEYS.flatMap((key) => groups[key]).find(
        (candidate) => candidate.id === todoId,
      )
      if (!todo) return

      const nextStatus = statusForBoardColumn(columnKey, todo.status)
      if (nextStatus === todo.status) return
      actions.handleStatusChange(todoId, nextStatus)
    },
    [groups, actions],
  )

  if (actions.isLoading || labelsLoading) {
    return <ProjectBoardSkeleton />
  }

  if (!project) {
    return (
      <div className="flex h-[calc(100vh-160px)] flex-col items-center justify-center gap-3 text-center">
        <LayoutGrid
          className="h-6 w-6"
          style={{ color: 'var(--text-muted)' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          That project no longer exists.
        </p>
        <Link
          href={PROJECTS_ROUTE}
          className="text-xs font-medium underline underline-offset-4"
          style={{ color: 'var(--primary)' }}
        >
          Back to projects
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      <HeaderActions>
        <div
          className="flex items-center gap-0.5 rounded-lg p-0.5"
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-color)',
          }}
          role="tablist"
          aria-label="Project view"
        >
          {(
            [
              { key: 'board' as const, label: 'Board', icon: LayoutGrid },
              { key: 'trash' as const, label: 'Trash', icon: Trash2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon
            const isActive = view === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setView(tab.key)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor: isActive
                    ? 'color-mix(in srgb, var(--primary) 16%, transparent)'
                    : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
                {tab.key === 'trash' && projectDeletedTodos.length > 0 && (
                  <span className="tabular-nums">
                    {projectDeletedTodos.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </HeaderActions>

      {/* Project header */}
      <div className="mb-4 flex flex-shrink-0 flex-wrap items-center gap-3">
        <Link
          href={PROJECTS_ROUTE}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text-muted)',
          }}
          aria-label="All projects"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
        <span
          className="h-3 w-3 rounded-full"
          style={{
            backgroundColor: project.color,
            boxShadow: `0 0 0 4px color-mix(in srgb, ${project.color} 18%, transparent)`,
          }}
        />
        <h1
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {project.name}
        </h1>
        {project.archived && (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-muted)',
            }}
          >
            Archived
          </span>
        )}
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {activeCount} open · {doneCount} done
        </span>
        <button
          type="button"
          onClick={() =>
            void (project.archived
              ? handleRestoreProject(project.id)
              : handleArchiveProject(project.id))
          }
          disabled={isProjectMutating}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-color)',
          }}
          title={
            project.archived
              ? 'Restore project — brings it back to active lists'
              : 'Archive project — keeps all history, hides it from active lists'
          }
        >
          {project.archived ? (
            <ArchiveRestore className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
          {project.archived ? 'Restore' : 'Archive'}
        </button>
      </div>

      {view === 'board' ? (
        <ProjectBoard
          columns={columns}
          project={project}
          onMoveToColumn={handleMoveToColumn}
          onReorder={actions.handleReorder}
          onCreateTodo={actions.handleCreate}
          isSaving={actions.isSaving}
          expandedLanes={expandedLanes}
          onLaneExpandedChange={setLaneExpanded}
          isLoadingFinished={anyExpanded && actions.isLoadingCompleted}
          onEdit={actions.handleEdit}
          onStatusChange={actions.handleStatusChange}
          onPriorityChange={actions.handlePriorityChange}
          onDelete={actions.handleDelete}
          onPermanentDelete={actions.handlePermanentDelete}
          onRestore={actions.handleRestore}
          onToggleSubtask={actions.handleToggleSubtask}
          onUpdateSubtasks={actions.handleUpdateSubtasks}
          onOpenNote={noteDrawer.handleOpenNote}
          people={people}
          subtaskMentions={subtaskMentions}
        />
      ) : (
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {projectDeletedTodos.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <Trash2
                className="h-5 w-5"
                style={{ color: 'var(--text-muted)' }}
              />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Nothing deleted in this project
              </p>
            </div>
          ) : (
            projectDeletedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onStatusChange={actions.handleStatusChange}
                onPriorityChange={actions.handlePriorityChange}
                onDelete={actions.handlePermanentDelete}
                onEdit={actions.handleEdit}
                onRestore={actions.handleRestore}
                people={people}
                subtaskMentions={subtaskMentions}
                viewMode="deleted"
                animateTransitions={false}
              />
            ))
          )}
        </div>
      )}

      {/* Creating happens inline at the top of Backlog — no floating button. */}
      <TodoDialogs
        editingTodo={actions.editingTodo}
        isEditOpen={actions.isEditOpen}
        onEditOpenChange={actions.handleEditOpenChange}
        onUpdate={actions.handleUpdate}
        isSaving={actions.isSaving}
        people={people}
        noteDrawer={noteDrawer}
      />
    </div>
  )
}

function ProjectBoardSkeleton() {
  // Only the open lanes — the finished ones load as narrow rails.
  const lanes = BOARD_COLUMNS.filter((column) => !column.terminal)

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4 lg:flex-row">
      {lanes.map((column) => (
        <div
          key={column.key}
          className="flex-1 animate-pulse rounded-xl"
          style={{ backgroundColor: 'var(--surface-2)' }}
        />
      ))}
    </div>
  )
}
