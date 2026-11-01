'use client'

import { useSyncExternalStore } from 'react'

// Recharts needs resolved colours (it interpolates and writes SVG attributes), so the dawn & dusk tokens are read
// from the computed style of <html> and re-read whenever the theme changes.
const TOKENS = {
  primary: '--dd-primary',
  accent: '--dd-accent',
  textPrimary: '--dd-text',
  textMuted: '--dd-muted',
  textQuiet: '--dd-quiet',
  surface: '--dd-surface',
  surface2: '--dd-surface-2',
  border: '--dd-border',
  wash: '--dd-wash',
  ok: '--dd-ok',
  warn: '--dd-warn',
  bad: '--dd-bad',
  info: '--dd-info',
  floatBg: '--dd-float-bg',
  /** The chart system's "Other" tone (`.dd-chart-other`). */
  other: '--dd-tone-2',
  set1: '--dd-set-1',
  set2: '--dd-set-2',
  set3: '--dd-set-3',
  set4: '--dd-set-4',
  set5: '--dd-set-5',
  set6: '--dd-set-6',
  set7: '--dd-set-7',
  set8: '--dd-set-8',
  statusTodo: '--dd-muted',
  statusInProgress: '--dd-info',
  statusWaiting: '--dd-warn',
  statusUnderReview: '--dd-set-6',
  statusOnHold: '--dd-set-5',
  statusBlocked: '--dd-bad',
  statusDone: '--dd-ok',
  priorityLow: '--dd-muted',
  priorityMedium: '--dd-warn',
  priorityHigh: '--dd-set-4',
  priorityUrgent: '--dd-bad',
} as const

/** Gridlines and the baseline are mixed from the text colour, as in `.dd-chart` (8% and 26%). */
const DERIVED = ['grid', 'baseline'] as const

export type ChartColorKey = keyof typeof TOKENS | (typeof DERIVED)[number]
export type ChartColors = Record<ChartColorKey, string>

/**
 * Chart series in the system's fixed order (`.dd-chart-s1` … `-s8`: terracotta, honey, wine, rose, sand, ochre,
 * apricot, amber). Series `i` takes `colors[CHART_SERIES[i]]` and its legend key the class `seriesClass(i)`.
 */
export const CHART_SERIES = [
  'set4',
  'set1',
  'set6',
  'set5',
  'set8',
  'set7',
  'set3',
  'set2',
] as const satisfies readonly ChartColorKey[]

const SET_KEYS = [
  'set1',
  'set2',
  'set3',
  'set4',
  'set5',
  'set6',
  'set7',
  'set8',
] as const satisfies readonly ChartColorKey[]

/** The resolved colour of `--dd-set-N` (1–8), e.g. for a category whose chip uses that set. */
export function setColor(colors: ChartColors, set: number) {
  return colors[SET_KEYS[(set - 1) % SET_KEYS.length]]
}

/** The `.dd-chart-sN` class for series `index` (0-based), so legends and tooltips match the marks. */
export function seriesClass(index: number) {
  return `dd-chart-s${(index % CHART_SERIES.length) + 1}`
}

/** The resolved colour of series `index` (0-based). */
export function seriesColor(colors: ChartColors, index: number) {
  return colors[CHART_SERIES[index % CHART_SERIES.length]]
}

export function isChartColorKey(key: string): key is ChartColorKey {
  return key in TOKENS || (DERIVED as readonly string[]).includes(key)
}

let cache: { key: string; colors: ChartColors } | null = null

function themeKey() {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches
  return `${document.documentElement.dataset.theme ?? 'system'}:${dark}`
}

function readColors(): ChartColors {
  const key = themeKey()
  if (cache?.key === key) return cache.colors
  const style = getComputedStyle(document.documentElement)
  const tokens = Object.fromEntries(
    Object.entries(TOKENS).map(([name, token]) => [
      name,
      style.getPropertyValue(token).trim() || 'currentColor',
    ]),
  ) as Record<keyof typeof TOKENS, string>
  const text = tokens.textPrimary
  const colors: ChartColors = {
    ...tokens,
    grid: `color-mix(in oklab, ${text} 8%, transparent)`,
    baseline: `color-mix(in oklab, ${text} 26%, transparent)`,
  }
  cache = { key, colors }
  return colors
}

const EMPTY = Object.fromEntries(
  [...Object.keys(TOKENS), ...DERIVED].map((name) => [name, 'currentColor']),
) as ChartColors

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  const query = matchMedia('(prefers-color-scheme: dark)')
  query.addEventListener('change', onChange)
  return () => {
    observer.disconnect()
    query.removeEventListener('change', onChange)
  }
}

/** Resolved dawn & dusk colours for charts, following the active theme. */
export function useChartColors(): ChartColors {
  return useSyncExternalStore(subscribe, readColors, () => EMPTY)
}
