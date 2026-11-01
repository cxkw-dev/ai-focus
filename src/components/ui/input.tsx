import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  size?: 'sm' | 'md' | 'lg'
  /** Leading affix inside the box, usually an <Icon />. */
  leading?: React.ReactNode
  /** Trailing content inside the box (a unit, a clear button). */
  trailing?: React.ReactNode
  /** Class on the tonal box; `className` goes on the native input. */
  boxClassName?: string
}

/**
 * The dawn & dusk tonal input box without a label (`.dd-input > .dd-input__control`), for search boxes and inline
 * fields. Forms with a visible label use TextField (dd-field with the tucked label) instead.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { size = 'md', leading, trailing, boxClassName, className, ...props },
    ref,
  ) {
    return (
      <div
        className={cn(
          'dd-input',
          size !== 'md' && `dd-input--${size}`,
          boxClassName,
        )}
      >
        {leading && <span className="dd-input__affix">{leading}</span>}
        <input
          ref={ref}
          className={cn('dd-input__control', className)}
          {...props}
        />
        {trailing}
      </div>
    )
  },
)

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  boxClassName?: string
}

/** The tonal textarea box (`.dd-input.dd-textarea`), no label. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ boxClassName, className, ...props }, ref) {
    return (
      <div className={cn('dd-input dd-textarea', boxClassName)}>
        <textarea
          ref={ref}
          className={cn('dd-input__control', className)}
          {...props}
        />
      </div>
    )
  },
)

/**
 * A labelled text field: dd-field with the tucked label inside the box, plus hint or error. Re-exported from the
 * system's React layer; `fieldClassName` sizes the wrapper, `className` the native input.
 */
export { Input as TextField } from 'dawn-and-dusk/react'
export type { InputProps as TextFieldProps } from 'dawn-and-dusk/react'
