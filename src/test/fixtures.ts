export function makeTodoRow(overrides: Record<string, unknown> = {}) {
  const now = new Date()
  return {
    id: 't-1',
    taskNumber: 1,
    title: 'row',
    description: null,
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: null,
    order: 0,
    archived: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    statusChangedAt: now,
    myPrUrls: [],
    githubPrUrls: [],
    azureWorkItemUrl: null,
    azureDepUrls: [],
    myIssueUrls: [],
    githubIssueUrls: [],
    notebookNoteId: null,
    labels: [],
    subtasks: [],
    notebookNote: null,
    sessions: [],
    ...overrides,
  }
}

export function makeLabelRow(overrides: Record<string, unknown> = {}) {
  const now = new Date()
  return {
    id: 'l-1',
    name: 'Focus',
    color: '#ff0000',
    createdAt: now,
    updatedAt: now,
    billingCodes: [],
    ...overrides,
  }
}

export function makeNotebookNoteRow(overrides: Record<string, unknown> = {}) {
  const now = new Date()
  return {
    id: 'n-1',
    title: 'Hello',
    content: '<p>body</p>',
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function makePersonRow(overrides: Record<string, unknown> = {}) {
  const now = new Date()
  return {
    id: 'p-1',
    name: 'Alice',
    email: 'alice@example.com',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

import { Prisma } from '@prisma/client'

export function prismaError(code: string, message = 'prisma error') {
  return new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion: '7.0.0',
  })
}
