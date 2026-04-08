'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ScratchPad } from './scratch-pad'

interface ScratchPadDrawerProps {
  open: boolean
  onClose: () => void
}

export function ScratchPadDrawer({ open, onClose }: ScratchPadDrawerProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            onClick={onClose}
          />
          {/* Drawer panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[61] flex w-[560px] max-w-[90vw] flex-col"
            style={{
              backgroundColor: 'var(--surface)',
              borderLeft: '1px solid var(--border-color)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 rounded-md p-1.5 transition-colors hover:bg-white/5"
              aria-label="Close scratch pad"
            >
              <X
                className="h-3.5 w-3.5"
                style={{ color: 'var(--text-muted)' }}
              />
            </button>

            {/* Editor */}
            <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
              <ScratchPad className="h-full" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
