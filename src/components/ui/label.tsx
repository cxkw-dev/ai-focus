import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * A plain label above a control or group, in the system's "label above" style (`.dd-field--above` label): sentence
 * case, 600 weight. For a single text control prefer TextField, whose label tucks inside the box.
 */
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn(
        'text-text peer-disabled:text-quiet text-sm leading-tight font-semibold peer-disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
})
