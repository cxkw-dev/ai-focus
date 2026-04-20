'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sidebar } from './sidebar'
import { Header } from './header'
import {
  HeaderActionsProvider,
  useHeaderActions,
} from './header-actions-context'

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

function getSidebarCollapsedServerSnapshot(): boolean {
  return false
}

const pageTitles: Record<string, string> = {
  '/todos': 'Todos',
  '/labels': 'Labels',
  '/notes': 'Notes',
  '/review': 'Year in Review',
  '/settings': 'Settings',
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <HeaderActionsProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </HeaderActionsProvider>
  )
}

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const title = pageTitles[pathname] || 'Focus'
  const { actions } = useHeaderActions()

  const collapsed = React.useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  )
  const [isMobile, setIsMobile] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [isReady, setIsReady] = React.useState(false)
  const [prevPathname, setPrevPathname] = React.useState(pathname)

  // Reset mobile menu when navigation happens (React 19 "reset on prop change" pattern)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setMobileMenuOpen(false)
  }

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setIsReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleCollapse = (newCollapsed: boolean) => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(newCollapsed))
    window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT))
  }

  const transition = isReady
    ? { duration: 0.2, ease: 'easeInOut' as const }
    : { duration: 0 }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          collapsed={collapsed}
          onCollapse={handleCollapse}
          transition={transition}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar
            collapsed={false}
            onCollapse={() => setMobileMenuOpen(false)}
          />
        </>
      )}

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : collapsed ? 72 : 256,
        }}
        transition={transition}
        className="flex min-h-screen flex-col"
      >
        <Header
          title={title}
          showMenuButton={isMobile}
          onMenuClick={() => setMobileMenuOpen(true)}
          actions={actions}
        />
        <div className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:p-4">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
