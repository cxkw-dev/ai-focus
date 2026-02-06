'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare,
  ChevronLeft,
  Settings,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  transition?: { duration: number; ease?: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear' }
}

const navItems = [
  {
    title: 'Todos',
    href: '/todos',
    icon: CheckSquare,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar({ collapsed, onCollapse, transition = { duration: 0.2, ease: 'easeInOut' } }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={transition}
        className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
      >
        {/* Logo */}
        <div className={`flex h-16 items-center border-b overflow-hidden ${collapsed ? 'justify-center px-0' : 'px-4'}`} style={{ borderColor: 'var(--border-color)' }}>
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/icon.svg"
              alt="Focus"
              width={32}
              height={32}
              className="shrink-0"
              style={{ imageRendering: 'pixelated' }}
            />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  key="expanded"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-3xl font-bold uppercase whitespace-nowrap overflow-hidden"
                  style={{
                    fontFamily: '"Pixelify Sans", sans-serif',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent), var(--status-done))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Focus
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 space-y-1 ${collapsed ? 'px-2 py-3' : 'p-3'}`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            const navLink = (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
                style={isActive ? {
                  backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                  color: 'var(--primary)',
                  boxShadow: '0 1px 3px color-mix(in srgb, var(--primary) 20%, transparent)',
                } : {
                  color: 'var(--text-muted)',
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return navLink
          })}
        </nav>

        {/* Collapse Toggle - Edge positioned */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={() => onCollapse(!collapsed)}
              className="absolute top-1/2 -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full border shadow-lg shadow-black/20 transition-colors"
              style={{
                transform: 'translateY(-50%)',
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-muted)',
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ rotate: collapsed ? 180 : 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <ChevronLeft className="h-3 w-3" />
              </motion.div>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {collapsed ? 'Expand' : 'Collapse'}
          </TooltipContent>
        </Tooltip>
      </motion.aside>
    </TooltipProvider>
  )
}
