'use client'

import * as React from 'react'
import {
  Button as DdButton,
  type ButtonProps as DdButtonProps,
} from 'dawn-and-dusk/react'
import { Icon, type IconName } from '@/components/ui/icon'
import { Tip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * dawn & dusk button: `variant` primary | secondary (default) | ghost | ink | danger | link, `size` sm | md | lg,
 * `loading`. One primary per screenful; row actions are ghost. Icons lead the label: `<Icon name="plus" />Add`.
 */
export type ButtonProps = DdButtonProps
export const Button = DdButton

export interface IconButtonProps extends Omit<
  DdButtonProps,
  'children' | 'aria-label'
> {
  icon: IconName
  /** Accessible name, also shown as the tooltip. */
  label: string
  /** Hide the tooltip (e.g. when a menu opens from this button). */
  noTip?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/** A square, icon-only dd-btn (ghost by default) with an accessible name and a tooltip. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, label, noTip, side, variant = 'ghost', className, ...props },
    ref,
  ) {
    const button = (
      <DdButton
        ref={ref}
        variant={variant}
        aria-label={label}
        className={cn('dd-btn--icon', className)}
        {...props}
      >
        <Icon name={icon} />
      </DdButton>
    )
    if (noTip) return button
    return (
      <Tip label={label} side={side}>
        {button}
      </Tip>
    )
  },
)
