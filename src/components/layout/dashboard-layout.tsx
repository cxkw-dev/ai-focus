'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { TopBar, type Crumb } from './top-bar'
import {
  HeaderActionsProvider,
  useHeaderActions,
} from './header-actions-context'
import { useProjectNav } from '@/hooks/use-project-nav'
import { PROJECTS_ROUTE } from '@/lib/projects'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'
const SIDEBAR_COLLAPSED_EVENT = 'ai-focus-sidebar-collapsed'

function subscribeSidebarCollapsed(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, callback)
  }
}

function getSidebarCollapsedSnapshot(): boolean {
  try {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    return saved ? (JSON.parse(saved) as boolean) : false
  } catch {
    return false
  }
}

const pageTitles: Record<string, string> = {
  '/labels': 'labels',
  '/notes': 'notes',
  '/review': 'year in review',
  '/settings': 'settings',
}

function useCrumbs(pathname: string): Crumb[] {
  const { projects } = useProjectNav()
  if (pathname.startsWith(`${PROJECTS_ROUTE}/`)) {
    const id = pathname.slice(PROJECTS_ROUTE.length + 1)
    const project = projects.find((p) => p.id === id)
    return [{ label: 'projects' }, { label: project?.name ?? 'project' }]
  }
  return [{ label: pageTitles[pathname] ?? 'focus' }]
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <HeaderActionsProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </HeaderActionsProvider>
  )
}

/**
 * The dawn & dusk app shell: side nav on the left, top bar and a scrolling content area on the right. The shell is
 * the viewport; under 768px of it the side nav goes off-canvas and the top bar shows its menu button. It paints no
 * plain fill of its own, so the page tone with its grain (as on the style guide) shows through and the tonal
 * surfaces on it (board lanes, panels) read a step darker in dusk.
 */
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const crumbs = useCrumbs(pathname)
  const { actions } = useHeaderActions()

  const collapsed = React.useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    () => false,
  )
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [prevPathname, setPrevPathname] = React.useState(pathname)

  // Close the off-canvas nav when navigation happens (React 19 "reset on prop change" pattern).
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setMobileNavOpen(false)
  }

  const handleCollapse = (next: boolean) => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT))
  }

  return (
    <div className="dd-app-shell bg-transparent [--dd-accordion-hover:inherit] [--dd-card-hover:inherit] [--dd-data-table-grain:inherit]">
      <Sidebar
        collapsed={collapsed}
        onCollapse={handleCollapse}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="dd-app-shell__main">
        <TopBar
          crumbs={crumbs}
          mobileNavOpen={mobileNavOpen}
          onOpenNav={() => setMobileNavOpen(true)}
          actions={actions}
        />
        <main className="dd-app-shell__content flex flex-col px-3 pt-3 pb-5 sm:px-5 sm:pt-4">
          {children}
        </main>
      </div>
    </div>
  )
}
