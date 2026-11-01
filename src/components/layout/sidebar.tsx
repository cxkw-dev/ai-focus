'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SidebarProjects } from './sidebar-projects'
import { Icon, type IconName } from '@/components/ui/icon'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useVpnStatus } from '@/hooks/use-vpn-status'
import { useLocalAiStatus } from '@/hooks/use-local-ai-status'
import { useIsClient } from '@/hooks/use-is-client'
import { PROJECTS_ROUTE } from '@/lib/projects'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  /** Off-canvas (narrow shell): the nav is slid in over the scrim. */
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const TIMESHEET_URL =
  'https://s4hprd.sap.kyndryl.net/sap/bc/gui/sap/its/webgui#'

interface RailItem {
  title: string
  href: string
  icon: IconName
  /** Also current on nested routes (e.g. /projects/[id]). */
  prefix?: boolean
}

const topItems: RailItem[] = [
  { title: 'Notes', href: '/notes', icon: 'file' },
  { title: 'Projects', href: PROJECTS_ROUTE, icon: 'folder', prefix: true },
  { title: 'Review', href: '/review', icon: 'chart' },
  { title: 'Labels', href: '/labels', icon: 'tag' },
]

function isCurrent(item: RailItem, pathname: string) {
  return item.prefix
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href
}

function RailLink({ item, pathname }: { item: RailItem; pathname: string }) {
  const current = isCurrent(item, pathname)
  return (
    <Link
      href={item.href}
      className="dd-side-nav__item"
      aria-label={item.title}
      data-label={item.title}
      aria-current={current ? 'page' : undefined}
    >
      <Icon name={item.icon} />
    </Link>
  )
}

/** Local model status: a dot on the AI icon; click re-checks the connection. */
function LocalAiRailItem() {
  const { data, isLoading, refetch, isFetching } = useLocalAiStatus()
  const mounted = useIsClient()

  if (!mounted || isLoading) return null

  const connected = data?.connected ?? false
  const label = data?.label ?? 'Local AI'
  const model = data?.model ?? ''
  const state = isFetching ? 'idle' : connected ? 'ok' : 'bad'
  const description = `${model || label} · ${
    isFetching ? 'checking' : connected ? 'connected' : 'unreachable'
  }`

  return (
    <button
      type="button"
      onClick={() => refetch()}
      className="dd-side-nav__item"
      aria-label={`${description}. Click to re-check`}
      data-label={description}
    >
      <Icon name="ai-model" />
      <span className={`dd-side-nav__dot dd-side-nav__dot--${state}`} />
    </button>
  )
}

type TimesheetState = 'idle' | 'checking' | 'still-disconnected'

/**
 * Opens the SAP timesheet, which only loads on the corporate VPN. A disconnected VPN re-checks first and explains
 * itself in a tooltip instead of opening a dead tab.
 */
function TimesheetRailItem() {
  const {
    data: vpnConnected,
    isLoading: vpnLoading,
    refetch: refetchVpn,
  } = useVpnStatus()
  const [state, setState] = React.useState<TimesheetState>('idle')
  const [checking, setChecking] = React.useState(false)
  const resetTimerRef = React.useRef<number | null>(null)

  React.useEffect(
    () => () => {
      if (resetTimerRef.current !== null)
        window.clearTimeout(resetTimerRef.current)
    },
    [],
  )

  const handleClick = async () => {
    if (checking) return
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
    setChecking(true)
    setState('checking')
    try {
      const result = await refetchVpn()
      if (result.data === true) {
        setState('idle')
        window.open(TIMESHEET_URL, '_blank', 'noopener,noreferrer')
        return
      }
      setState('still-disconnected')
      resetTimerRef.current = window.setTimeout(() => {
        setState('idle')
        resetTimerRef.current = null
      }, 2400)
    } finally {
      setChecking(false)
    }
  }

  const dot =
    state === 'checking' || vpnLoading ? 'idle' : vpnConnected ? 'ok' : 'bad'
  const label = vpnLoading
    ? 'Timesheet · checking VPN'
    : vpnConnected === false
      ? 'Timesheet · VPN off, click to re-check'
      : 'Timesheet · opens in a new tab'
  const message =
    state === 'checking'
      ? 'Checking VPN…'
      : 'VPN still disconnected. Reconnect, then try again.'

  return (
    <Tooltip open={state !== 'idle'}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          aria-disabled={checking}
          aria-label={label}
          data-label={state === 'idle' ? label : undefined}
          className="dd-side-nav__item"
        >
          <Icon name="clock" />
          <span className={`dd-side-nav__dot dd-side-nav__dot--${dot}`} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {message}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * dawn & dusk side nav ("icon rail · two-level"): the rail holds the app's sections and live status; the panel holds
 * the projects, the primary way through the app. The chevron folds the panel away; on a narrow shell the whole nav
 * slides in over a scrim.
 */
export function Sidebar({
  collapsed,
  onCollapse,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname()

  React.useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen, onMobileClose])

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        id="app-nav"
        aria-label="Main"
        className={cn(
          'dd-side-nav',
          collapsed && !mobileOpen && 'is-collapsed',
          mobileOpen && 'is-mobile-open',
        )}
        // The off-canvas scrim is the nav's own ::before, so a click on it lands on the nav itself.
        onClick={(event) => {
          if (mobileOpen && event.target === event.currentTarget)
            onMobileClose?.()
        }}
      >
        <div className="dd-side-nav__rail">
          <Link
            href="/notes"
            className="dd-side-nav__logo dd-logo-tile"
            aria-label="ai-focus home"
          >
            f
          </Link>
          {topItems.map((item) => (
            <RailLink key={item.href} item={item} pathname={pathname} />
          ))}
          <span className="dd-side-nav__spacer" />
          <TimesheetRailItem />
          <LocalAiRailItem />
          <RailLink
            item={{ title: 'Settings', href: '/settings', icon: 'settings' }}
            pathname={pathname}
          />
          <span className="dd-side-nav__sep" />
          <button
            type="button"
            className="dd-side-nav__item dd-side-nav__collapse"
            aria-controls="app-nav-panel"
            aria-expanded={mobileOpen || !collapsed}
            aria-label={
              mobileOpen
                ? 'Close navigation'
                : collapsed
                  ? 'Expand navigation'
                  : 'Collapse navigation'
            }
            data-label={
              mobileOpen ? 'Close' : collapsed ? 'Expand' : 'Collapse'
            }
            onClick={() =>
              mobileOpen ? onMobileClose?.() : onCollapse(!collapsed)
            }
          >
            <Icon name="chevron-left" />
          </button>
        </div>
        <div className="dd-side-nav__panel" id="app-nav-panel">
          <SidebarProjects pathname={pathname} />
        </div>
      </nav>
    </TooltipProvider>
  )
}
