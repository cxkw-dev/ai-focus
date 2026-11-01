'use client'

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from '@/components/ui/drawer'
import { ScratchPad } from './scratch-pad'

interface ScratchPadDrawerProps {
  open: boolean
  onClose: () => void
}

export function ScratchPadDrawer({ open, onClose }: ScratchPadDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DrawerContent className="[--_w:35rem]">
        <DrawerHeader eyebrow="Notes" title="scratch pad" />
        <DrawerBody className="flex flex-col">
          <ScratchPad className="min-h-0 flex-1" />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
