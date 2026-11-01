'use client'

import * as React from 'react'
import { Icon } from '@/components/ui/icon'
import { PRIORITIES } from '@/lib/priority'
import type { Priority } from '@/types/todo'

interface PrioritySelectorProps {
  value: Priority
  onChange: (value: Priority) => void
  disabled?: boolean
}

/**
 * Priority as a full-width dawn & dusk segmented control (the native-radio version, so arrow keys and focus come
 * from the browser). Each segment leads with its priority icon in the priority's colour.
 */
export function PrioritySelector({
  value,
  onChange,
  disabled,
}: PrioritySelectorProps) {
  const name = React.useId()

  return (
    <fieldset className="dd-segmented dd-segmented--block" disabled={disabled}>
      <legend className="dd-visually-hidden">Priority</legend>
      {PRIORITIES.map((priority) => (
        <label key={priority.value} className="dd-segmented__item">
          <input
            type="radio"
            name={name}
            value={priority.value}
            checked={value === priority.value}
            onChange={() => onChange(priority.value)}
          />
          <Icon name={priority.icon} style={{ color: priority.colorVar }} />
          <span>{priority.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
