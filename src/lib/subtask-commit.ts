import {
  htmlToPlainText,
  isHtmlContent,
  normalizeSubtaskTitle,
} from '@/lib/rich-text'

export interface RecentSubtaskCommit {
  value: string
  at: number
}

export function normalizeSubtaskCommitValue(value: string): string {
  const normalized = isHtmlContent(value) ? htmlToPlainText(value) : value
  return normalizeSubtaskTitle(normalized).replace(/\s+/g, ' ')
}

export function isRapidDuplicateSubtaskCommit(
  lastCommit: RecentSubtaskCommit | null,
  value: string,
  now = Date.now(),
  windowMs = 250,
): boolean {
  if (!lastCommit) return false

  return (
    lastCommit.value === normalizeSubtaskCommitValue(value) &&
    now - lastCommit.at < windowMs
  )
}
