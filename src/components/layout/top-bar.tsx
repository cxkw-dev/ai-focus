'use client'

import * as React from 'react'
import Link from 'next/link'
import { setTheme } from 'dawn-and-dusk/react'
import { Icon } from '@/components/ui/icon'
import { Tip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  href?: string
}

interface TopBarProps {
  /** Where you are: the last crumb is the page title (a lowercase lockup). */
  crumbs: Crumb[]
  mobileNavOpen: boolean
  onOpenNav: () => void
  actions?: React.ReactNode
}

function toggleTheme() {
  const root = document.documentElement
  const dusk =
    root.dataset.theme === 'dusk' ||
    (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches)
  setTheme(dusk ? 'dawn' : 'dusk')
}

/** dawn & dusk top bar: menu button (narrow shells), where-you-are title, page actions and the theme switch. */
export function TopBar({
  crumbs,
  mobileNavOpen,
  onOpenNav,
  actions,
}: TopBarProps) {
  const page = crumbs[crumbs.length - 1]
  const trail = crumbs.slice(0, -1)

  return (
    <header className="dd-top-bar min-h-[56px]">
      <button
        type="button"
        className="dd-btn dd-btn--ghost dd-btn--icon dd-top-bar__nav-btn"
        aria-controls="app-nav"
        aria-expanded={mobileNavOpen}
        aria-label="Open navigation"
        onClick={onOpenNav}
      >
        <Icon name="menu" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {trail.map((crumb) => (
          <React.Fragment key={crumb.label}>
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="dd-top-bar__switch text-muted hidden sm:inline-flex"
              >
                <span>{crumb.label}</span>
              </Link>
            ) : (
              <span className="text-muted hidden sm:inline">{crumb.label}</span>
            )}
            <span className="text-faint hidden sm:inline" aria-hidden="true">
              /
            </span>
          </React.Fragment>
        ))}
        {/* A nested page (a project board) carries its own lockup title, so the bar keeps a quiet breadcrumb. */}
        <h1
          className={cn(
            'm-0 min-w-0 truncate',
            trail.length > 0
              ? 'text-text text-sm font-semibold'
              : 'font-display tracking-heading text-lg leading-tight font-extrabold lowercase',
          )}
        >
          {page.label}
        </h1>
      </div>

      <div className="dd-top-bar__actions">
        {actions}
        <Tip label="Switch between dawn and dusk" side="bottom">
          <button
            type="button"
            className="dd-btn dd-btn--ghost dd-btn--icon dd-top-bar__icon-btn"
            aria-label="Switch theme"
            onClick={toggleTheme}
          >
            <Icon name="moon" className="dusk:hidden" />
            <Icon name="sun" className="dawn:hidden" />
          </button>
        </Tip>
      </div>
    </header>
  )
}
