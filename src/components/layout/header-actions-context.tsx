'use client'

import * as React from 'react'

interface HeaderActionsContextValue {
  actions: React.ReactNode
  setActions: (actions: React.ReactNode) => void
}

const HeaderActionsContext = React.createContext<HeaderActionsContextValue>({
  actions: null,
  setActions: () => {},
})

export function HeaderActionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [actions, setActions] = React.useState<React.ReactNode>(null)
  const value = React.useMemo(() => ({ actions, setActions }), [actions])
  return (
    <HeaderActionsContext.Provider value={value}>
      {children}
    </HeaderActionsContext.Provider>
  )
}

export function useHeaderActions() {
  return React.useContext(HeaderActionsContext)
}

/**
 * Renders children into the header actions slot.
 * Cleans up on unmount.
 */
export function HeaderActions({ children }: { children: React.ReactNode }) {
  const { setActions } = useHeaderActions()

  React.useEffect(() => {
    setActions(children)
    return () => setActions(null)
  }, [children, setActions])

  return null
}
