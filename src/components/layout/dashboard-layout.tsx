'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

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

  React.useEffect(() => {
    // Load collapsed state from localStorage
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    if (savedCollapsed !== null) {
      setCollapsed(JSON.parse(savedCollapsed))
    }
  }, [])

  const handleCollapse = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar collapsed={collapsed} onCollapse={handleCollapse} />
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar collapsed={false} onCollapse={() => setMobileMenuOpen(false)} />
        </>
      )}

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : collapsed ? 72 : 256,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex flex-col min-h-screen"
      >
        <Header
          title={title}
          showMenuButton={isMobile}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <div className="flex-1 p-4 flex flex-col min-h-0">{children}</div>
      </motion.main>
    </div>
  )
}
