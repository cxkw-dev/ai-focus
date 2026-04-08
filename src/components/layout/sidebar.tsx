'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import type { IconType } from 'react-icons'
import {
  RiDonutChartLine,
  RiPriceTag3Line,
  RiSettings4Line,
  RiStickyNoteLine,
  RiTaskLine,
  RiTimeLine,
} from 'react-icons/ri'
import { useVpnStatus } from '@/hooks/use-vpn-status'
import { useOllamaStatus } from '@/hooks/use-ollama-status'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  transition?: {
    duration: number
    ease?: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear'
  }
}

const TIMESHEET_URL =
  'https://s4hprd.sap.kyndryl.net/sap/bc/gui/sap/its/webgui#'

const topNavItems = [
  { title: 'Todos', href: '/todos', icon: RiTaskLine },
  { title: 'Notes', href: '/notes', icon: RiStickyNoteLine },
]

const bottomNavItems = [
  { title: 'Review', href: '/review', icon: RiDonutChartLine },
  { title: 'Labels', href: '/labels', icon: RiPriceTag3Line },
  { title: 'Settings', href: '/settings', icon: RiSettings4Line },
]

function OllamaStatusBar({ collapsed }: { collapsed: boolean }) {
  const { data, isLoading, refetch, isFetching } = useOllamaStatus()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) return null

  const connected = data?.connected ?? false
  const model = data?.model ?? ''
  const url = data?.url ?? ''

  const dotColor = isFetching
    ? 'var(--text-muted)'
    : connected
      ? '#22c55e'
      : '#ef4444'

  const button = (
    <button
      type="button"
      onClick={() => refetch()}
      className={`flex w-full items-center text-[10px] tracking-wide uppercase transition-opacity hover:opacity-100 ${collapsed ? 'justify-center' : 'gap-2'}`}
      style={{ color: 'var(--text-muted)', opacity: 0.7 }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden truncate whitespace-nowrap"
          >
            {model || 'ollama'}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <div className="text-xs">
          <p className="font-medium">
            {connected ? 'Ollama connected' : 'Ollama unreachable'}
          </p>
          {url && <p style={{ color: 'var(--text-muted)' }}>{url}</p>}
          <p style={{ color: 'var(--text-muted)', marginTop: 2 }}>
            Click to refresh
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function renderNavItem(
  item: {
    title: string
    href: string
    icon: IconType
  },
  pathname: string,
  collapsed: boolean,
) {
  const isActive = pathname === item.href
  const Icon = item.icon

  const navLink = (
    <Link
      key={item.href}
      href={item.href}
      className={`flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors duration-200 ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
      style={
        isActive
          ? {
              backgroundColor:
                'color-mix(in srgb, var(--primary) 15%, transparent)',
              color: 'var(--primary)',
              boxShadow:
                '0 1px 3px color-mix(in srgb, var(--primary) 20%, transparent)',
            }
          : {
              color: 'var(--text-muted)',
            }
      }
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
}

export function Sidebar({
  collapsed,
  onCollapse,
  transition = { duration: 0.2, ease: 'easeInOut' },
}: SidebarProps) {
  const pathname = usePathname()
  const { data: vpnConnected, isLoading: vpnLoading } = useVpnStatus()

  const timesheetButton = (
    <button
      type="button"
      onClick={() =>
        window.open(TIMESHEET_URL, '_blank', 'noopener,noreferrer')
      }
      className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors duration-200 ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
      style={{ color: 'var(--text-muted)' }}
    >
      <span className="relative shrink-0">
        <RiTimeLine className="h-5 w-5" />
        <span
          className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border"
          style={{
            borderColor: 'var(--surface)',
            backgroundColor: vpnLoading
              ? 'var(--text-muted)'
              : vpnConnected
                ? '#22c55e'
                : '#ef4444',
          }}
        />
      </span>
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
          >
            Timesheet
            <ExternalLink className="h-3 w-3 opacity-50" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={transition}
        className="fixed top-0 left-0 z-40 flex h-screen flex-col border-r"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Logo */}
        <div
          className={`flex h-16 items-center overflow-hidden border-b ${collapsed ? 'justify-center px-0' : 'px-4'}`}
          style={{ borderColor: 'var(--border-color)' }}
        >
          <Link href="/" className="group flex items-center gap-3">
            <div
              className="shrink-0 overflow-hidden rounded-lg"
              style={{
                width: collapsed ? 36 : 40,
                height: collapsed ? 36 : 40,
                backgroundColor: 'var(--primary)',
              }}
            >
              <Image
                src="/icon-192.png"
                alt="Focus"
                width={40}
                height={40}
                className="h-full w-full"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  key="brand-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden text-xl font-bold whitespace-nowrap uppercase"
                  style={{
                    fontFamily: 'var(--font-pixelify), sans-serif',
                    color: 'var(--text-primary)',
                  }}
                >
                  Focus
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <div className="flex flex-1 flex-col">
          {/* Top Navigation */}
          <nav
            className={`flex flex-col gap-1 ${collapsed ? 'px-2 py-3' : 'p-3'}`}
          >
            {topNavItems.map((item) =>
              renderNavItem(item, pathname, collapsed),
            )}
          </nav>

          {/* Timesheet Section */}
          <nav
            className={`flex flex-col gap-1 border-t ${collapsed ? 'px-2 py-3' : 'p-3'}`}
            style={{ borderColor: 'var(--border-color)' }}
          >
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{timesheetButton}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Timesheet {vpnConnected ? '(VPN connected)' : '(VPN off)'}
                </TooltipContent>
              </Tooltip>
            ) : (
              timesheetButton
            )}
          </nav>
        </div>

        {/* Bottom Navigation */}
        <nav
          className={`flex flex-col gap-1 border-t ${collapsed ? 'px-2 py-3' : 'p-3'}`}
          style={{ borderColor: 'var(--border-color)' }}
        >
          {bottomNavItems.map((item) =>
            renderNavItem(item, pathname, collapsed),
          )}
        </nav>

        {/* Status bar (vscode-style) */}
        <div
          className={`border-t ${collapsed ? 'px-2 py-2' : 'px-4 py-2'}`}
          style={{ borderColor: 'var(--border-color)' }}
        >
          <OllamaStatusBar collapsed={collapsed} />
        </div>

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
