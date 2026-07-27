import { labelsApi, peopleApi, todosApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

/**
 * The board and the project list are read by nearly every screen, and every
 * route change remounts their hooks. With the default 60s staleTime that meant
 * a ~220KB board refetch (plus two label lists) on the first project switch
 * after a minute of reading — the new board rendered, then re-rendered wholesale
 * when the identical payload landed.
 *
 * Freshness does not depend on that polling: `/api/events` pushes an
 * invalidation for every write, and useSSE re-invalidates everything when the
 * stream reconnects. So these are cached until something actually changes.
 *
 * `staleTime: Infinity` alone is the right lever — it stops time-based
 * refetching without disabling refetch-on-mount, so a query invalidated while
 * its screen was unmounted still refreshes the next time you land on it.
 */
export function todoBoardQueryOptions() {
  return {
    queryKey: queryKeys.todoBoard,
    queryFn: todosApi.board,
    staleTime: Infinity,
  }
}

/**
 * Fetched lazily: `enabled` is driven by whether a Done lane is open. Once
 * loaded it stays cached for the session like everything else here.
 */
export function completedTodosQueryOptions(enabled: boolean) {
  return {
    queryKey: queryKeys.completedTodos,
    queryFn: todosApi.completed,
    staleTime: Infinity,
    enabled,
  }
}

export function activeLabelsQueryOptions() {
  return {
    queryKey: queryKeys.labels,
    queryFn: () => labelsApi.list('active'),
    staleTime: Infinity,
  }
}

/**
 * Every card is handed the people list for @-mentions, so a refetch hands back
 * a new array identity and re-renders the whole board for data that changed by
 * nothing. Same SSE contract as the others.
 */
export function peopleQueryOptions() {
  return {
    queryKey: queryKeys.people,
    queryFn: peopleApi.list,
    staleTime: Infinity,
  }
}

export function archivedLabelsQueryOptions() {
  return {
    queryKey: queryKeys.archivedLabels,
    queryFn: () => labelsApi.list('archived'),
    staleTime: Infinity,
  }
}
