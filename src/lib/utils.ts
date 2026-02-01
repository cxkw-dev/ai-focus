import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()

  // Reset times to midnight for accurate day comparison
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const diffMs = dateOnly.getTime() - todayOnly.getTime()
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 1 && days <= 7) return `In ${days} days`
  if (days < -1 && days >= -7) return `${Math.abs(days)} days overdue`
  if (days < -7) return `Overdue`
  return formatDate(d)
}
