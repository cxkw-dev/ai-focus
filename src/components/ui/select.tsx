import * as React from 'react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'size'
> {
  options?: SelectOption[]
  size?: 'sm' | 'md' | 'lg'
  /** Shown as a disabled first option while nothing is chosen. */
  placeholder?: string
  /** Class on the tonal box; `className` goes on the native select. */
  boxClassName?: string
}

/**
 * The dawn & dusk native select: a <select> in the tonal `.dd-input.dd-select` box with the chevron. Native is the
 * system's recommendation for plain value lists (best on mobile, no portal inside dialogs). Pass `options`, or
 * <option> children.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      options,
      size = 'md',
      placeholder,
      boxClassName,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <div
        className={cn(
          'dd-input dd-select',
          size !== 'md' && `dd-input--${size}`,
          boxClassName,
        )}
      >
        <select
          ref={ref}
          className={cn('dd-input__control', className)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <span className="dd-select__chevron" aria-hidden="true">
          <Icon name="chevron-down" />
        </span>
      </div>
    )
  },
)
