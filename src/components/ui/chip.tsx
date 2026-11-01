import * as React from 'react'
import { cn, cssVars } from '@/lib/utils'

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Colour set 1–8 (honey, amber, apricot, terracotta, rose, wine, ochre, sand), in order for categories. */
  set?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  /** Any colour (a status token like `var(--dd-info)`, or a user's label hex) tints the chip instead of a set. */
  color?: string
  /** A neutral chip with a leading dot in `color` (names a category without colouring the whole chip). */
  dot?: boolean
}

/**
 * dawn & dusk chip ("Soft wash"): a tinted fill with deep text in the same hue, for tags, labels and categories.
 * Status (ok/warn/bad/info) should also say it in words or an icon, never colour alone.
 */
export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { set, color, dot, className, style, children, ...props },
  ref,
) {
  const tint = !dot && color ? cssVars({ '--dd-chip': color }) : undefined
  return (
    <span
      ref={ref}
      className={cn('dd-chip', set && `dd-chip--set-${set}`, className)}
      style={{ ...tint, ...style }}
      {...props}
    >
      {dot && (
        <i
          className="dd-chip__dot"
          style={color ? cssVars({ '--dd-chip-dot': color }) : undefined}
        />
      )}
      {children}
    </span>
  )
})
