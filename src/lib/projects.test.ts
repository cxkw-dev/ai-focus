import { describe, expect, it } from 'vitest'
import {
  NO_PROJECT_KEY,
  countTodosByProject,
  filterTodosByProject,
  filterTodosWithoutProject,
  findProject,
  groupTodosByProject,
  projectHref,
  searchProjects,
  sortProjectsByName,
  todoHasNoProject,
} from '@/lib/projects'
import type { Label, Todo } from '@/types/todo'

function makeProject(id: string, name: string): Label {
  return {
    id,
    name,
    color: '#22c55e',
    billingCodes: [],
    archived: false,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function makeTodo(id: string, labels: Label[]): Todo {
  return {
    id,
    taskNumber: 1,
    title: id,
    description: null,
    status: 'TODO',
    archived: false,
    priority: 'MEDIUM',
    dueDate: null,
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    statusChangedAt: '2026-01-01T00:00:00.000Z',
    labels,
    subtasks: [],
    myPrUrls: [],
    githubPrUrls: [],
    azureWorkItemUrl: null,
    azureDepUrls: [],
    myIssueUrls: [],
    githubIssueUrls: [],
    notebookNoteId: null,
    sessions: [],
  }
}

const kaf = makeProject('p-kaf', 'KAF')
const acme = makeProject('p-acme', 'Acme')

describe('projects', () => {
  it('builds board hrefs', () => {
    expect(projectHref('p-kaf')).toBe('/projects/p-kaf')
  })

  it('finds a project by id', () => {
    expect(findProject([kaf, acme], 'p-acme')).toBe(acme)
    expect(findProject([kaf], 'missing')).toBeUndefined()
  })

  it('filters todos by project and by no-project', () => {
    const todos = [
      makeTodo('a', [kaf]),
      makeTodo('b', [acme, kaf]),
      makeTodo('c', []),
    ]

    expect(filterTodosByProject(todos, 'p-kaf').map((t) => t.id)).toEqual([
      'a',
      'b',
    ])
    expect(filterTodosWithoutProject(todos).map((t) => t.id)).toEqual(['c'])
    expect(todoHasNoProject(todos[2])).toBe(true)
  })

  it('counts todos per project, crediting each of a multi-project todo', () => {
    const counts = countTodosByProject([
      makeTodo('a', [kaf]),
      makeTodo('b', [acme, kaf]),
      makeTodo('c', []),
    ])

    expect(counts['p-kaf']).toBe(2)
    expect(counts['p-acme']).toBe(1)
    expect(counts[NO_PROJECT_KEY]).toBe(1)
  })

  it('groups todos under their primary project, no-project last', () => {
    const groups = groupTodosByProject([
      makeTodo('a', [acme]),
      makeTodo('b', []),
      makeTodo('c', [kaf, acme]),
      makeTodo('d', [acme]),
    ])

    expect(groups.map((g) => g.name)).toEqual(['Acme', 'KAF', 'No project'])
    expect(groups[0].todos.map((t) => t.id)).toEqual(['a', 'd'])
    // A multi-project todo lands in its first project only — groups partition.
    expect(groups[1].todos.map((t) => t.id)).toEqual(['c'])
    expect(groups[2].projectId).toBeNull()
    expect(groups.flatMap((g) => g.todos)).toHaveLength(4)
  })

  it('searches and sorts by name', () => {
    expect(sortProjectsByName([kaf, acme]).map((p) => p.name)).toEqual([
      'Acme',
      'KAF',
    ])
    expect(searchProjects([kaf, acme], 'ka').map((p) => p.id)).toEqual([
      'p-kaf',
    ])
    expect(searchProjects([kaf, acme], '  ')).toHaveLength(2)
  })
})
