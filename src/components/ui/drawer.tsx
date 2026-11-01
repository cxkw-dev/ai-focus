'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Icon } from '@/components/ui/icon'
import { DialogOverlay, isFloatingLayerTarget } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * dawn & dusk drawer: a full-height panel from the right for details and editing, over the dialog scrim. Radix
 * Dialog owns focus, Escape and outside clicks.
 *
 *   <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
 *     <DrawerContent size="lg">
 *       <DrawerHeader eyebrow="Linked note" title={todo.title} actions={<IconButton icon="link" label="Unlink" />} />
 *       <DrawerBody>…</DrawerBody>
 *       <DrawerFooter>…</DrawerFooter>          // optional; stays in view
 *     </DrawerContent>
 *   </Drawer>
 */
const Drawer = DialogPrimitive.Root
const DrawerTrigger = DialogPrimitive.Trigger
const DrawerClose = DialogPrimitive.Close

interface DrawerContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  /** sm 360px · md 480px (default) · lg 720px; full width on phones. */
  size?: 'sm' | 'md' | 'lg'
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(function DrawerContent(
  { className, children, size = 'md', onInteractOutside, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        className={cn(
          'dd-drawer z-[60] flex flex-col',
          'animate-[dd-drawer-in_var(--dd-dur)_var(--dd-ease)]',
          size !== 'md' && `dd-drawer--${size}`,
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
    </DialogPrimitive.Portal>
  )
})

interface DrawerHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  /** Meta row under the title: short facts, each an inline-flex item. */
  meta?: React.ReactNode
  /** Extra header buttons, placed before the close button. */
  actions?: React.ReactNode
}

/** Head: eyebrow, lowercase lockup title, meta row, actions and the close button. */
function DrawerHeader({
  title,
  eyebrow,
  meta,
  actions,
  className,
  ...props
}: DrawerHeaderProps) {
  return (
    <div className={cn('dd-drawer__head', className)} {...props}>
      <div className="dd-drawer__titles">
        {eyebrow && <p className="dd-drawer__eyebrow">{eyebrow}</p>}
        <DialogPrimitive.Title className="dd-drawer__title">
          {title}
        </DialogPrimitive.Title>
        {meta && <div className="dd-drawer__meta">{meta}</div>}
      </div>
      {actions && (
        <div className="flex flex-none items-center gap-1">{actions}</div>
      )}
      <DialogPrimitive.Close className="dd-drawer__close" aria-label="Close">
        <Icon name="x" />
      </DialogPrimitive.Close>
    </div>
  )
}

function DrawerBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('dd-drawer__body', className)} {...props} />
}

function DrawerSection({
  title,
  className,
  children,
  ...props
}: Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  title?: React.ReactNode
}) {
  return (
    <section className={cn('dd-drawer__section', className)} {...props}>
      {title && <h3 className="dd-drawer__section-title">{title}</h3>}
      {children}
    </section>
  )
}

function DrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('dd-drawer__foot', className)} {...props} />
}

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerSection,
  DrawerFooter,
}
