'use client'

import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { RiGithubFill } from 'react-icons/ri'
import { VscAzureDevops } from 'react-icons/vsc'
import { Tip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** The dd-badge intents a linked PR, issue or work item can take. */
export type IntegrationIntent = 'neutral' | 'ok' | 'warn' | 'bad' | 'info'

interface BrandIconProps {
  className?: string
  style?: CSSProperties
}

/** GitHub mark, sized like a dd icon (1.15em of the text). */
export function GitHubIcon({ className, style }: BrandIconProps) {
  return (
    <RiGithubFill
      className={cn('dd-icon', className)}
      style={style}
      aria-hidden
    />
  )
}

/** Azure DevOps mark, sized like a dd icon (1.15em of the text). */
export function AzureIcon({ className, style }: BrandIconProps) {
  return (
    <VscAzureDevops
      className={cn('dd-icon', className)}
      style={style}
      aria-hidden
    />
  )
}

// The badge is a link inside clickable cards; the card must not also open.
function stopPropagation(event: MouseEvent) {
  event.stopPropagation()
}

interface IntegrationBadgeProps {
  url: string
  /** PR / issue number or work item id, shown in mono. */
  reference: string | number
  /** Leading icon (a dd `Icon`, a lucide git mark or a brand mark). */
  icon: ReactNode
  intent?: IntegrationIntent
  /** One-word state ("Merged"). Omitted when the state is unknown. */
  label?: string
  /** Extra segment between the state and the reference. */
  detail?: ReactNode
  tip?: string
}

/** A status badge that links out to the PR, issue or work item: icon, state word, then `#ref` in mono. */
export function IntegrationBadge({
  url,
  reference,
  icon,
  intent = 'neutral',
  label,
  detail,
  tip,
}: IntegrationBadgeProps) {
  const badge = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={stopPropagation}
      className={cn(
        'dd-badge dd-badge--soft max-w-full',
        `dd-badge--${intent}`,
      )}
    >
      {icon}
      {label ? (
        <>
          <span className="max-w-24 truncate">{label}</span>
          {detail}
          <span className="dd-badge__count">#{reference}</span>
        </>
      ) : (
        <span className="font-mono font-medium tracking-normal tabular-nums">
          #{reference}
        </span>
      )}
    </a>
  )

  return tip ? <Tip label={tip}>{badge}</Tip> : badge
}

/** Placeholder while the status loads: not a link yet, just the reference with an inline spinner. */
export function IntegrationBadgeLoading({
  reference,
}: {
  reference: string | number
}) {
  return (
    <span
      className="dd-badge dd-badge--soft dd-badge--neutral"
      aria-busy="true"
    >
      <span
        className="dd-spinner dd-spinner--inline dd-spinner--muted"
        aria-hidden="true"
      />
      <span className="font-mono font-medium tracking-normal tabular-nums">
        #{reference}
      </span>
    </span>
  )
}

/** A badge followed by the item's title, truncated to the row. */
export function IntegrationTitleRow({
  badge,
  title,
  children,
}: {
  badge: ReactNode
  title: string
  /** Shown between the badge and the title. */
  children?: ReactNode
}) {
  return (
    <span className="flex w-full min-w-0 items-center gap-1.5">
      {badge}
      {children}
      <span className="text-muted min-w-0 flex-1 truncate text-xs">
        {title}
      </span>
    </span>
  )
}
