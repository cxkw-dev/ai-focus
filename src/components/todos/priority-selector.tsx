'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PRIORITIES } from '@/lib/priority'
import type { Priority } from '@/types/todo'

interface PrioritySelectorProps {
  value: Priority
  onChange: (value: Priority) => void
  disabled?: boolean
}

export function PrioritySelector({ value, onChange, disabled }: PrioritySelectorProps) {
  return (
    <div
      className="inline-flex w-full items-center rounded-full border p-1"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-2)' }}
    >
      {PRIORITIES.map((priority) => {
        const isSelected = value === priority.value

        return (
          <button
            key={priority.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(priority.value)}
            className={cn(
              'relative flex-1 select-none px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors',
              'rounded-full',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{ color: isSelected ? 'var(--primary-foreground)' : 'var(--text-muted)' }}
          >
            {isSelected && (
              <motion.span
                layoutId="priority-pill"
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: priority.colorVar }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: isSelected ? 'var(--primary-foreground)' : priority.colorVar }}
              />
              {priority.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
