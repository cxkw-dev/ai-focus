import { vi } from 'vitest'

type MockMethods =
  | 'findMany'
  | 'findFirst'
  | 'findUnique'
  | 'findUniqueOrThrow'
  | 'create'
  | 'createMany'
  | 'update'
  | 'upsert'
  | 'delete'
  | 'deleteMany'
  | 'count'
  | 'aggregate'
  | 'groupBy'

type MockModel = Record<MockMethods, ReturnType<typeof vi.fn>>

function makeModel(): MockModel {
  return {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  }
}

const transactionImpl = async (arg: unknown) => {
  if (typeof arg === 'function') {
    return (arg as (tx: typeof dbMock) => unknown)(dbMock)
  }
  if (Array.isArray(arg)) {
    return Promise.all(arg)
  }
  return arg
}

export const dbMock = {
  todo: makeModel(),
  subtask: makeModel(),
  label: makeModel(),
  billingCode: makeModel(),
  note: makeModel(),
  notebookNote: makeModel(),
  person: makeModel(),
  todoContact: makeModel(),
  session: makeModel(),
  statusUpdate: makeModel(),
  accomplishment: makeModel(),
  $transaction: vi.fn(transactionImpl),
}

export function resetDbMock() {
  for (const [key, value] of Object.entries(dbMock)) {
    if (key === '$transaction') continue
    for (const fn of Object.values(value as Record<string, unknown>)) {
      const mock = fn as { mockReset?: () => void }
      if (typeof mock.mockReset === 'function') {
        mock.mockReset()
      }
    }
  }
  dbMock.$transaction.mockReset()
  dbMock.$transaction.mockImplementation(transactionImpl)
}
