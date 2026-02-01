import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: '',
        destructive: '',
        outline: 'border',
        secondary: '',
        ghost: '',
        link: 'underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: 'var(--primary)',
    color: 'var(--primary-foreground)',
  },
  destructive: {
    backgroundColor: 'var(--destructive)',
    color: 'var(--destructive-foreground)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
  },
  secondary: {
    backgroundColor: 'var(--surface-2)',
    color: 'var(--text-primary)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
  },
  link: {
    backgroundColor: 'transparent',
    color: 'var(--primary)',
  },
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={{ ...variantStyles[variant || 'default'], ...style }}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
