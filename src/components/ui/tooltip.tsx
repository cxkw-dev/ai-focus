'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * The dawn & dusk tooltip chip (ink in dawn, a raised surface in dusk) with its arrow. Radix places it; the system's
 * `.dd-tooltip--static` keeps it in Radix's positioned wrapper instead of its own fixed layer.
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent(
  { className, side = 'top', sideOffset = 8, ...props },
  ref,
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        sideOffset={sideOffset}
        data-placement={side}
        className={cn(
          'dd-tooltip dd-tooltip--static is-open animate-fade-in z-[90]',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
})

interface TipProps {
  label: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Render the child without a tooltip. */
  disabled?: boolean
}

/** Wraps one focusable element with a short tooltip on hover and keyboard focus. */
function Tip({ label, children, side = 'top', disabled }: TipProps) {
  if (disabled || !label) return children
  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { Tip, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
