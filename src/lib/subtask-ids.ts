export const CLIENT_SUBTASK_ID_PREFIX = 'new-'

export function createClientSubtaskId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `${CLIENT_SUBTASK_ID_PREFIX}${crypto.randomUUID()}`
  }

  return `${CLIENT_SUBTASK_ID_PREFIX}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function isClientSubtaskId(subtaskId: string): boolean {
  return subtaskId.startsWith(CLIENT_SUBTASK_ID_PREFIX)
}
