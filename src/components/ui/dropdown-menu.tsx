'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Icon, type IconName } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

/**
 * dawn & dusk menu ("Grouped · text only": a floating tonal panel, full-bleed rows, small-caps group labels,
 * hairline separators) on Radix DropdownMenu, which owns keyboard, focus and placement.
 *
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild><IconButton icon="more" label="Actions" noTip /></DropdownMenuTrigger>
 *     <DropdownMenuContent align="end">
 *       <DropdownMenuLabel>Status</DropdownMenuLabel>
 *       <DropdownMenuItem icon="edit">Edit</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem icon="trash" danger>Delete</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 */
const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const itemClass =
  'dd-menu__item data-highlighted:bg-float-hover data-disabled:cursor-not-allowed data-disabled:text-quiet'
const panelClass =
  'dd-menu z-[70] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto overscroll-contain animate-[dd-menu-in_var(--dd-dur)_var(--dd-ease)]'

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(panelClass, className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
})

interface ItemProps extends React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
> {
  icon?: IconName
  danger?: boolean
}

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  ItemProps
>(function DropdownMenuItem(
  { className, icon, danger, children, ...props },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(itemClass, danger && 'dd-menu__item--danger', className)}
      {...props}
    >
      {icon && <Icon name={icon} className="dd-menu__icon" />}
      {children}
    </DropdownMenuPrimitive.Item>
  )
})

/** A checkable row; the check sits at the end and shows when checked (aria-checked). */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(itemClass, className)}
      {...props}
    >
      {children}
      <Icon name="check" className="dd-menu__check" />
    </DropdownMenuPrimitive.CheckboxItem>
  )
})

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(itemClass, className)}
      {...props}
    >
      {children}
      <Icon name="check" className="dd-menu__check" />
    </DropdownMenuPrimitive.RadioItem>
  )
})

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    icon?: IconName
  }
>(function DropdownMenuSubTrigger(
  { className, icon, children, ...props },
  ref,
) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(itemClass, 'data-[state=open]:bg-float-hover', className)}
      {...props}
    >
      {icon && <Icon name={icon} className="dd-menu__icon" />}
      {children}
      <Icon name="chevron-right" className="dd-menu__sub" />
    </DropdownMenuPrimitive.SubTrigger>
  )
})

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(function DropdownMenuSubContent({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        ref={ref}
        className={cn(panelClass, className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
})

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn('dd-menu__label', className)}
      {...props}
    />
  )
})

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn('dd-menu__sep', className)}
      {...props}
    />
  )
})

function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return <kbd className={cn('dd-menu__kbd', className)} {...props} />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
