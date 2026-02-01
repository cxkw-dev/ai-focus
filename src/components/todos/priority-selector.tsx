'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Zap, TrendingUp, Minus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Priority } from '@/types/todo'

interface PrioritySelectorProps {
  value: Priority
  onChange: (value: Priority) => void
  disabled?: boolean
}

const priorities: {
  value: Priority
  label: string
  icon: React.ElementType
  colorVar: string
}[] = [
  {
    value: 'LOW',
    label: 'Low',
    icon: ChevronDown,
    colorVar: 'var(--priority-low)',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    icon: Minus,
    colorVar: 'var(--priority-medium)',
  },
  {
    value: 'HIGH',
    label: 'High',
    icon: TrendingUp,
    colorVar: 'var(--priority-high)',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    icon: Zap,
    colorVar: 'var(--priority-urgent)',
  },
]

export function PrioritySelector({ value, onChange, disabled }: PrioritySelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {priorities.map((priority) => {
        const isSelected = value === priority.value
        const Icon = priority.icon

        return (
          <motion.button
            key={priority.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(priority.value)}
            className={cn(
              'relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all',
              'hover:scale-[1.02] active:scale-[0.98]',
              'disabled:opacity-50 disabled:pointer-events-none'
            )}
            style={isSelected ? {
              backgroundColor: `color-mix(in srgb, ${priority.colorVar} 15%, transparent)`,
              borderColor: `color-mix(in srgb, ${priority.colorVar} 50%, transparent)`,
              boxShadow: `0 0 10px color-mix(in srgb, ${priority.colorVar} 30%, transparent)`,
            } : {
              backgroundColor: 'color-mix(in srgb, var(--background) 50%, transparent)',
              borderColor: 'var(--border-color)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Selection indicator ring */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-lg border-2"
                style={{ borderColor: `color-mix(in srgb, ${priority.colorVar} 50%, transparent)` }}
                layoutId="priority-selector-ring"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* Icon with gradient */}
            <motion.div
              className="relative flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: isSelected ? priority.colorVar : 'var(--surface-2)' }}
              animate={isSelected && priority.value === 'URGENT' ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: isSelected ? 'var(--primary-foreground)' : 'var(--text-muted)' }}
              />
            </motion.div>

            {/* Label */}
            <span
              className="text-xs font-medium"
              style={{ color: isSelected ? priority.colorVar : 'var(--text-muted)' }}
            >
              {priority.label}
            </span>

            {/* Active pulse for urgent */}
            {isSelected && priority.value === 'URGENT' && (
              <motion.div
                className="absolute -top-1 -right-1 h-2.5 w-2.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                  style={{ backgroundColor: priority.colorVar }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: priority.colorVar }}
                />
              </motion.div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
