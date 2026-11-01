'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Icon, type IconName } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

/**
 * dawn & dusk dialog ("Classic": a centred card on a dim scrim, actions bottom-right) on Radix Dialog, which owns
 * focus, Escape, outside clicks and stacking with the menus and popovers opened inside it.
 *
 *   <Dialog open onOpenChange>
 *     <DialogContent size="lg">
 *       <form className="dd-dialog__form" onSubmit={…}>       // optional: a form steps out of the layout
 *         <DialogHeader title="edit todo" eyebrow="Project · AMEX" icon="edit" />
 *         <DialogBody>…fields…</DialogBody>
 *         <DialogFooter hint="⌘ ↵ to save"><Button>Cancel</Button><Button variant="primary" type="submit">Save</Button></DialogFooter>
 *       </form>
 *     </DialogContent>
 *   </Dialog>
 */
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

/** Floating layers rendered outside the dialog (TipTap mention lists) must not count as an outside click. */
export function isFloatingLayerTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('[data-tippy-root]')
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'animate-fade-in bg-overlay fixed inset-0 z-[60]',
        className,
      )}
      {...props}
    />
  )
})

interface DialogContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  size?: 'sm' | 'md' | 'lg'
  /** Bad-tinted icon tile for destructive confirmations. */
  danger?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent(
  { className, children, size = 'md', danger, onInteractOutside, ...props },
  ref,
) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        className={cn(
          'dd-dialog fixed inset-0 z-[60] flex h-fit flex-col',
          'animate-[dd-dialog-in_var(--dd-dur)_var(--dd-ease)]',
          size !== 'md' && `dd-dialog--${size}`,
          danger && 'dd-dialog--danger',
          className,
        )}
        onInteractOutside={(event) => {
          if (isFloatingLayerTarget(event.target)) event.preventDefault()
          onInteractOutside?.(event)
        }}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})

interface DialogHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  icon?: IconName
  /** Hide the close button (the footer has a Cancel). Default: shown. */
  hideClose?: boolean
}

/** Head: optional icon tile, eyebrow and the lowercase lockup title, plus the close button. */
function DialogHeader({
  title,
  eyebrow,
  icon,
  hideClose,
  className,
  children,
  ...props
}: DialogHeaderProps) {
  return (
    <div className={cn('dd-dialog__head', className)} {...props}>
      {icon && (
        <span className="dd-dialog__icon">
          <Icon name={icon} />
        </span>
      )}
      <div className="dd-dialog__titles">
        {eyebrow && <p className="dd-dialog__eyebrow">{eyebrow}</p>}
        <DialogPrimitive.Title className="dd-dialog__title">
          {title}
        </DialogPrimitive.Title>
      </div>
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className="dd-dialog__close" aria-label="Close">
          <Icon name="x" />
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

/** Body: scrolls between the fixed head and foot. */
function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('dd-dialog__body', className)} {...props} />
}

/** Foot: actions bottom-right, an optional mono hint on the left. */
function DialogFooter({
  hint,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hint?: React.ReactNode }) {
  return (
    <div className={cn('dd-dialog__foot', className)} {...props}>
      {hint && <span className="dd-dialog__hint">{hint}</span>}
      {children}
    </div>
  )
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('dd-dialog__title', className)}
      {...props}
    />
  )
})

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-muted m-0 text-sm', className)}
      {...props}
    />
  )
})

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
