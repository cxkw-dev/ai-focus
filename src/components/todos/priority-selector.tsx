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
  gradient: string
  activeGradient: string
  borderColor: string
  glowColor: string
}[] = [
  {
    value: 'LOW',
    label: 'Low',
    icon: ChevronDown,
    gradient: 'from-slate-400 to-slate-500',
    activeGradient: 'from-slate-500/20 to-slate-600/20',
    borderColor: 'border-slate-500/50',
    glowColor: '',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    icon: Minus,
    gradient: 'from-[#DBB06B] to-[#E39A7B]',
    activeGradient: 'from-[#DBB06B]/20 to-[#E39A7B]/20',
    borderColor: 'border-[#DBB06B]/50',
    glowColor: 'shadow-[0_0_10px_rgba(219,176,107,0.3)]',
  },
  {
    value: 'HIGH',
    label: 'High',
    icon: TrendingUp,
    gradient: 'from-[#E39A7B] to-[#FFB5AB]',
    activeGradient: 'from-[#E39A7B]/20 to-[#FFB5AB]/20',
    borderColor: 'border-[#E39A7B]/50',
    glowColor: 'shadow-[0_0_10px_rgba(227,154,123,0.3)]',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    icon: Zap,
    gradient: 'from-red-500 to-rose-500',
    activeGradient: 'from-red-500/20 to-rose-500/20',
    borderColor: 'border-red-500/50',
    glowColor: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
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
              'disabled:opacity-50 disabled:pointer-events-none',
              isSelected
                ? cn('bg-gradient-to-b', priority.activeGradient, priority.borderColor, priority.glowColor)
                : 'border-border bg-background/50 hover:border-muted-foreground/30'
            )}
            whileTap={{ scale: 0.95 }}
          >
            {/* Selection indicator ring */}
            {isSelected && (
              <motion.div
                className={cn(
                  'absolute inset-0 rounded-lg border-2',
                  priority.borderColor
                )}
                layoutId="priority-selector-ring"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* Icon with gradient */}
            <motion.div
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-full',
                isSelected
                  ? cn('bg-gradient-to-br', priority.gradient)
                  : 'bg-muted'
              )}
              animate={isSelected && priority.value === 'URGENT' ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Icon className={cn(
                'h-4 w-4',
                isSelected ? 'text-white' : 'text-muted-foreground'
              )} />
            </motion.div>

            {/* Label */}
            <span className={cn(
              'text-xs font-medium',
              isSelected
                ? cn('bg-gradient-to-r bg-clip-text text-transparent', priority.gradient)
                : 'text-muted-foreground'
            )}>
              {priority.label}
            </span>

            {/* Active pulse for urgent */}
            {isSelected && priority.value === 'URGENT' && (
              <motion.div
                className="absolute -top-1 -right-1 h-2.5 w-2.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </motion.div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
