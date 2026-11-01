'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'
import { Tip } from '@/components/ui/tooltip'
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
import { findProject } from '@/lib/projects'
import { cn, cssVars } from '@/lib/utils'

type ProjectView = 'board' | 'trash'

const VIEWS: { key: ProjectView; label: string; icon: IconName }[] = [
  { key: 'board', label: 'Board', icon: 'grid' },
  { key: 'trash', label: 'Trash', icon: 'trash' },
]

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
  const tabsId = React.useId()
  const tabRefs = React.useRef<Partial<Record<ProjectView, HTMLButtonElement>>>(
    {},
  )

  // The tabs are React-owned (no dd runtime): arrows, Home and End move the
  // selection and focus together, and only the selected tab is a Tab stop.
  const handleTabKeyDown = (event: React.KeyboardEvent) => {
    const index = VIEWS.findIndex((tab) => tab.key === view)
    const next =
      event.key === 'ArrowRight'
        ? VIEWS[(index + 1) % VIEWS.length]
        : event.key === 'ArrowLeft'
          ? VIEWS[(index - 1 + VIEWS.length) % VIEWS.length]
          : event.key === 'Home'
            ? VIEWS[0]
            : event.key === 'End'
              ? VIEWS[VIEWS.length - 1]
              : null
    if (!next) return
    event.preventDefault()
    setView(next.key)
    tabRefs.current[next.key]?.focus()
  }

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
      <div className="dd-empty-state my-auto">
        <div className="dd-empty-state__icon">
          <Icon name="grid" />
        </div>
        <h2 className="dd-empty-state__title">That project no longer exists</h2>
        <div className="dd-empty-state__actions">
          <Link href="/notes" className="dd-btn dd-btn--sm">
            <Icon name="arrow-left" />
            <span>Back to notes</span>
          </Link>
        </div>
      </div>
    )
  }

  const panelId = (key: ProjectView) => `${tabsId}-${key}-panel`
  const tabId = (key: ProjectView) => `${tabsId}-${key}-tab`

  return (
    <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
      {/* Project header */}
      <div className="flex flex-none flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="dd-h3 flex min-w-0 items-center gap-2.5">
          <span
            className="size-3 flex-none rounded-full bg-(--project)"
            style={cssVars({ '--project': project.color })}
            aria-hidden="true"
          />
          <span className="min-w-0 truncate">{project.name}</span>
        </h2>
        {project.archived && (
          <span className="dd-badge dd-badge--neutral">Archived</span>
        )}
        <ul className="dd-page-header__meta">
          <li>
            <b>{activeCount}</b> open
          </li>
          <li>
            <b>{doneCount}</b> done
          </li>
        </ul>
        <Tip
          label={
            project.archived
              ? 'Restore project — brings it back to active lists'
              : 'Archive project — keeps all history, hides it from active lists'
          }
        >
          <Button
            size="sm"
            className="ml-auto"
            onClick={() =>
              void (project.archived
                ? handleRestoreProject(project.id)
                : handleArchiveProject(project.id))
            }
            disabled={isProjectMutating}
          >
            <Icon name={project.archived ? 'refresh' : 'archive'} />
            {project.archived ? 'Restore' : 'Archive'}
          </Button>
        </Tip>
      </div>

      <div className="dd-tabs dd-tabs--sm lg:min-h-0 lg:flex-1">
        <div
          className="dd-tabs__list flex-none"
          role="tablist"
          aria-label="Project view"
          onKeyDown={handleTabKeyDown}
        >
          {VIEWS.map((tab) => {
            const selected = view === tab.key
            return (
              <button
                key={tab.key}
                ref={(element) => {
                  if (element) tabRefs.current[tab.key] = element
                }}
                id={tabId(tab.key)}
                type="button"
                role="tab"
                className="dd-tabs__tab"
                aria-selected={selected}
                aria-controls={panelId(tab.key)}
                tabIndex={selected ? 0 : -1}
                onClick={() => setView(tab.key)}
              >
                <Icon name={tab.icon} />
                <span>{tab.label}</span>
                {tab.key === 'trash' && projectDeletedTodos.length > 0 && (
                  <span className="dd-tabs__count">
                    {projectDeletedTodos.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div
          id={panelId('board')}
          role="tabpanel"
          aria-labelledby={tabId('board')}
          className={cn(
            'dd-tabs__panel flex-col lg:min-h-0 lg:flex-1',
            view === 'board' && 'flex',
          )}
          hidden={view !== 'board'}
        >
          {view === 'board' && (
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
          )}
        </div>

        <div
          id={panelId('trash')}
          role="tabpanel"
          aria-labelledby={tabId('trash')}
          className="dd-tabs__panel dd-scroll lg:min-h-0 lg:flex-1"
          hidden={view !== 'trash'}
        >
          {view === 'trash' &&
            (projectDeletedTodos.length === 0 ? (
              <div className="dd-empty-state dd-empty-state--compact">
                <div className="dd-empty-state__icon">
                  <Icon name="trash" />
                </div>
                <h3 className="dd-empty-state__title">Trash is empty</h3>
                <p className="dd-empty-state__text">
                  Nothing deleted in this project.
                </p>
              </div>
            ) : (
              <div className="bg-well flex max-w-3xl flex-col gap-1.5 rounded-lg p-2">
                {projectDeletedTodos.map((todo) => (
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
                    projectId={project.id}
                    viewMode="deleted"
                    animateTransitions={false}
                  />
                ))}
              </div>
            ))}
        </div>
      </div>

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
    <div
      className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:flex-row"
      aria-busy="true"
    >
      <span className="dd-visually-hidden">Loading the board…</span>
      {lanes.map((column) => (
        <span
          key={column.key}
          className="dd-skeleton h-60 rounded-lg lg:h-auto lg:flex-1"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
