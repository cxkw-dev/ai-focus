'use client'

import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

/**
 * dawn & dusk toast: an ink slab in dawn, a raised dark surface in dusk; the intent tints only the icon. Radix owns
 * timing, swipe-to-dismiss and the live region. Variants: default (ok), info, destructive (bad).
 */
const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(function ToastViewport({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn('dd-toaster outline-none', className)}
      {...props}
    />
  )
})

type ToastVariant = 'default' | 'info' | 'destructive'

const intentClass: Record<ToastVariant, string> = {
  default: 'dd-toast--ok',
  info: 'dd-toast--info',
  destructive: 'dd-toast--bad',
}

const intentIcon = {
  default: 'success',
  info: 'info',
  destructive: 'error',
} as const

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    variant?: ToastVariant
  }
>(function Toast({ className, variant = 'default', children, ...props }, ref) {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        'dd-toast',
        intentClass[variant],
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
        'data-[state=closed]:opacity-0',
        className,
      )}
      {...props}
    >
      <Icon name={intentIcon[variant]} />
      {children}
    </ToastPrimitives.Root>
  )
})

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(function ToastAction({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Action
      ref={ref}
      className={cn('dd-toast__action', className)}
      {...props}
    />
  )
})

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(function ToastClose({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Close
      ref={ref}
      aria-label="Dismiss"
      className={cn('dd-toast__dismiss', className)}
      {...props}
    >
      <Icon name="x" />
    </ToastPrimitives.Close>
  )
})

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(function ToastTitle({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Title
      ref={ref}
      className={cn('dd-toast__title', className)}
      {...props}
    />
  )
})

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Description
      ref={ref}
      className={cn('dd-toast__text', className)}
      {...props}
    />
  )
})

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  type ToastVariant,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
