/**
 * Theme Configuration
 *
 * All app themes are defined here. The theme switcher uses this file
 * to populate the dropdown and apply CSS variables.
 */

export interface ThemeColors {
  // Backgrounds
  background: string
  surface: string
  surface2: string

  // Text
  textPrimary: string
  textMuted: string

  // Borders
  border: string

  // Primary action colors
  primary: string
  primaryHover: string
  primaryPressed: string
  primaryForeground: string

  // Accent colors
  accent: string
  accentForeground: string

  // Links
  link: string

  // Semantic colors
  destructive: string
  destructiveForeground: string

  // Status colors (for todo statuses)
  statusTodo: string
  statusInProgress: string
  statusWaiting: string
  statusUnderReview: string
  statusOnHold: string
  statusBlocked: string
  statusDone: string

  // Priority colors
  priorityLow: string
  priorityMedium: string
  priorityHigh: string
  priorityUrgent: string

  // Category colors (accomplishments)
  categoryDelivery: string
  categoryHiring: string
  categoryMentoring: string
  categoryCollaboration: string
  categoryGrowth: string
  categoryOther: string
}

export interface ThemeFonts {
  heading?: string
  body?: string
}

export interface Theme {
  id: string
  name: string
  description: string
  colors: ThemeColors
  fonts?: ThemeFonts
}

export const themes: Theme[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Geist — ink on near-white',
    colors: {
      // Backgrounds — near-white canvas, white elevated surfaces
      background: '#FAFAFA',
      surface: '#FFFFFF',
      surface2: '#F2F2F2',

      // Text — the deliberate grey ladder (ink → body → mute)
      textPrimary: '#171717',
      textMuted: '#666666',

      // Borders — the 1px hairline workhorse
      border: '#EBEBEB',

      // Primary — near-black ink, the marketing/app CTA fill
      primary: '#171717',
      primaryHover: '#383838',
      primaryPressed: '#000000',
      primaryForeground: '#FFFFFF',

      // Accent — the one Vercel blue
      accent: '#0070F3',
      accentForeground: '#FFFFFF',

      // Links
      link: '#0070F3',

      // Semantic colors
      destructive: '#E5484D',
      destructiveForeground: '#FFFFFF',

      // Status colors — drawn from the Geist accent family
      statusTodo: '#8F8F8F',
      statusInProgress: '#0070F3',
      statusWaiting: '#F5A623',
      statusUnderReview: '#7928CA',
      statusOnHold: '#EB367F',
      statusBlocked: '#E5484D',
      statusDone: '#45A557',

      // Priority colors
      priorityLow: '#8F8F8F',
      priorityMedium: '#F5A623',
      priorityHigh: '#FF4D4D',
      priorityUrgent: '#E5484D',

      // Category colors (accomplishments)
      categoryDelivery: '#0070F3',
      categoryHiring: '#EB367F',
      categoryMentoring: '#F5A623',
      categoryCollaboration: '#45A557',
      categoryGrowth: '#8F8F8F',
      categoryOther: '#7928CA',
    },
  },
  {
    id: 'vercel-dark',
    name: 'Vercel Dark',
    description: 'Geist — light on true black',
    colors: {
      // Backgrounds — true-black canvas
      background: '#000000',
      surface: '#0A0A0A',
      surface2: '#1A1A1A',

      // Text
      textPrimary: '#EDEDED',
      textMuted: '#A1A1A1',

      // Borders
      border: '#2E2E2E',

      // Primary — white fill (Vercel's dark-mode CTA)
      primary: '#FFFFFF',
      primaryHover: '#E5E5E5',
      primaryPressed: '#CCCCCC',
      primaryForeground: '#000000',

      // Accent
      accent: '#0070F3',
      accentForeground: '#FFFFFF',

      // Links
      link: '#3B9EFF',

      // Semantic colors
      destructive: '#E5484D',
      destructiveForeground: '#FFFFFF',

      // Status colors
      statusTodo: '#A1A1A1',
      statusInProgress: '#3B9EFF',
      statusWaiting: '#F5A623',
      statusUnderReview: '#BF7AF0',
      statusOnHold: '#EB367F',
      statusBlocked: '#FF5C5C',
      statusDone: '#62C073',

      // Priority colors
      priorityLow: '#A1A1A1',
      priorityMedium: '#F5A623',
      priorityHigh: '#FF6B6B',
      priorityUrgent: '#FF5C5C',

      // Category colors
      categoryDelivery: '#3B9EFF',
      categoryHiring: '#EB367F',
      categoryMentoring: '#F5A623',
      categoryCollaboration: '#62C073',
      categoryGrowth: '#A1A1A1',
      categoryOther: '#BF7AF0',
    },
  },
  {
    id: 'midnight-peach',
    name: 'Midnight Peach',
    description: 'Warm peach tones on dark',
    colors: {
      // Backgrounds - better separation
      background: '#0D0908',
      surface: '#1A1412',
      surface2: '#261E1B',

      // Text
      textPrimary: '#F6E9E3',
      textMuted: '#C9B6AE',

      // Borders
      border: '#2F2320',

      // Primary action colors
      primary: '#FFB199',
      primaryHover: '#FF9A7A',
      primaryPressed: '#FF8660',
      primaryForeground: '#0F0B0A',

      // Accent colors
      accent: '#FF7D8C',
      accentForeground: '#0F0B0A',

      // Links
      link: '#FFC3AD',

      // Semantic colors
      destructive: '#FF6B6B',
      destructiveForeground: '#0F0B0A',

      // Status colors
      statusTodo: '#C9B6AE',
      statusInProgress: '#FFB199',
      statusWaiting: '#FFCB8E',
      statusUnderReview: '#D4A5FF',
      statusOnHold: '#FF7D8C',
      statusBlocked: '#E04848',
      statusDone: '#7DD3A8',

      // Priority colors
      priorityLow: '#C9B6AE',
      priorityMedium: '#FFCB8E',
      priorityHigh: '#FFB199',
      priorityUrgent: '#FF6B6B',

      // Category colors
      categoryDelivery: '#FFB199',
      categoryHiring: '#FF7D8C',
      categoryMentoring: '#FFCB8E',
      categoryCollaboration: '#7DD3A8',
      categoryGrowth: '#C9B6AE',
      categoryOther: '#E8B4B8',
    },
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Blurple vibes',
    colors: {
      // Backgrounds - Discord's dark theme with better separation
      background: '#191A1D',
      surface: '#232428',
      surface2: '#2E3035',

      // Text
      textPrimary: '#DBDEE1',
      textMuted: '#949BA4',

      // Borders
      border: '#3F4147',

      // Primary - Discord blurple
      primary: '#5865F2',
      primaryHover: '#4752C4',
      primaryPressed: '#3C45A5',
      primaryForeground: '#FFFFFF',

      // Accent - Discord green
      accent: '#57F287',
      accentForeground: '#1E1F22',

      // Links
      link: '#00A8FC',

      // Semantic colors
      destructive: '#ED4245',
      destructiveForeground: '#FFFFFF',

      // Status colors
      statusTodo: '#949BA4',
      statusInProgress: '#5865F2',
      statusWaiting: '#FEE75C',
      statusUnderReview: '#A78BFA',
      statusOnHold: '#EB459E',
      statusBlocked: '#ED4245',
      statusDone: '#57F287',

      // Priority colors
      priorityLow: '#949BA4',
      priorityMedium: '#FEE75C',
      priorityHigh: '#F0B232',
      priorityUrgent: '#ED4245',

      // Category colors
      categoryDelivery: '#5865F2',
      categoryHiring: '#EB459E',
      categoryMentoring: '#FEE75C',
      categoryCollaboration: '#57F287',
      categoryGrowth: '#949BA4',
      categoryOther: '#A0A0A0',
    },
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Warm terracotta tones',
    fonts: {},
    colors: {
      // Backgrounds - Warm dark
      background: '#191919',
      surface: '#1F1F1F',
      surface2: '#282828',

      // Text - Cream tones
      textPrimary: '#E8E3DB',
      textMuted: '#A39990',

      // Borders
      border: '#353535',

      // Primary - Anthropic coral/terracotta
      primary: '#D97757',
      primaryHover: '#C4684A',
      primaryPressed: '#B05A3E',
      primaryForeground: '#FFFFFF',

      // Accent - Warm gold
      accent: '#DDA15E',
      accentForeground: '#191919',

      // Links
      link: '#E09B7A',

      // Semantic colors
      destructive: '#DC4C4C',
      destructiveForeground: '#FFFFFF',

      // Status colors
      statusTodo: '#A39990',
      statusInProgress: '#D97757',
      statusWaiting: '#DDA15E',
      statusUnderReview: '#C49DD8',
      statusOnHold: '#BC6C5A',
      statusBlocked: '#DC4C4C',
      statusDone: '#8FB67A',

      // Priority colors
      priorityLow: '#A39990',
      priorityMedium: '#DDA15E',
      priorityHigh: '#D97757',
      priorityUrgent: '#DC4C4C',

      // Category colors
      categoryDelivery: '#D97757',
      categoryHiring: '#BC6C5A',
      categoryMentoring: '#DDA15E',
      categoryCollaboration: '#8FB67A',
      categoryGrowth: '#A39990',
      categoryOther: '#B8A99A',
    },
  },
  {
    id: 'atom-one-dark',
    name: 'Atom One Dark',
    description: 'Classic developer theme',
    colors: {
      // Backgrounds - Atom's signature dark with better separation
      background: '#1B1D23',
      surface: '#22252C',
      surface2: '#2C3039',

      // Text - boosted contrast
      textPrimary: '#D7DAE0',
      textMuted: '#7F848E',

      // Borders
      border: '#3E4451',

      // Primary - Atom blue
      primary: '#61AFEF',
      primaryHover: '#79BBEF',
      primaryPressed: '#4FA0E5',
      primaryForeground: '#1E2127',

      // Accent - Atom purple
      accent: '#C678DD',
      accentForeground: '#1E2127',

      // Links
      link: '#61AFEF',

      // Semantic colors
      destructive: '#E06C75',
      destructiveForeground: '#FFFFFF',

      // Status colors
      statusTodo: '#7F848E',
      statusInProgress: '#61AFEF',
      statusWaiting: '#E5C07B',
      statusUnderReview: '#C678DD',
      statusOnHold: '#BE5046',
      statusBlocked: '#E06C75',
      statusDone: '#98C379',

      // Priority colors
      priorityLow: '#7F848E',
      priorityMedium: '#E5C07B',
      priorityHigh: '#D19A66',
      priorityUrgent: '#E06C75',

      // Category colors
      categoryDelivery: '#61AFEF',
      categoryHiring: '#C678DD',
      categoryMentoring: '#E5C07B',
      categoryCollaboration: '#98C379',
      categoryGrowth: '#7F848E',
      categoryOther: '#ABB2BF',
    },
  },
  {
    id: 'tron-legacy',
    name: 'Tron Legacy',
    description: 'The Grid awaits',
    fonts: {
      body: 'var(--font-inconsolata)',
    },
    colors: {
      // Backgrounds - near-pure black like the Grid
      background: '#050507',
      surface: '#0A0B0F',
      surface2: '#101218',

      // Text - cool white with blue cast
      textPrimary: '#D4E4F7',
      textMuted: '#6B7A8D',

      // Borders - subtle blue-gray lines
      border: '#1E2538',

      // Primary - Tron cyan/blue glow
      primary: '#6FC3DF',
      primaryHover: '#8DD3E8',
      primaryPressed: '#5BB0CF',
      primaryForeground: '#0A0A0F',

      // Accent - Tron orange (Rinzler / CLU)
      accent: '#DF740C',
      accentForeground: '#0A0A0F',

      // Links
      link: '#7FD4EF',

      // Semantic colors
      destructive: '#DF3B57',
      destructiveForeground: '#FFFFFF',

      // Status colors
      statusTodo: '#6B7A8D',
      statusInProgress: '#6FC3DF',
      statusWaiting: '#DF740C',
      statusUnderReview: '#9A5CCF',
      statusOnHold: '#DF3B57',
      statusBlocked: '#FF1744',
      statusDone: '#7AD4A0',

      // Priority colors
      priorityLow: '#6B7A8D',
      priorityMedium: '#DF740C',
      priorityHigh: '#E8A54B',
      priorityUrgent: '#DF3B57',

      // Category colors
      categoryDelivery: '#6FC3DF',
      categoryHiring: '#9A5CCF',
      categoryMentoring: '#DF740C',
      categoryCollaboration: '#7AD4A0',
      categoryGrowth: '#6B7A8D',
      categoryOther: '#8899AA',
    },
  },
]

export const defaultTheme =
  themes.find((t) => t.id === 'vercel-dark') ?? themes[0]

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || defaultTheme
}

function resolveFontValue(value: string): string {
  const match = value.match(/^var\((--[\w-]+)\)$/)
  if (match) {
    const resolved = getComputedStyle(document.body)
      .getPropertyValue(match[1])
      .trim()
    if (resolved) return resolved
  }
  return value
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  const { colors } = theme

  root.style.setProperty('--background', colors.background)
  root.style.setProperty('--surface', colors.surface)
  root.style.setProperty('--surface-2', colors.surface2)
  root.style.setProperty('--text-primary', colors.textPrimary)
  root.style.setProperty('--text-muted', colors.textMuted)
  root.style.setProperty('--border-color', colors.border)
  root.style.setProperty('--primary', colors.primary)
  root.style.setProperty('--primary-hover', colors.primaryHover)
  root.style.setProperty('--primary-pressed', colors.primaryPressed)
  root.style.setProperty('--primary-foreground', colors.primaryForeground)
  root.style.setProperty('--accent', colors.accent)
  root.style.setProperty('--accent-foreground', colors.accentForeground)
  root.style.setProperty('--link', colors.link)
  root.style.setProperty('--destructive', colors.destructive)
  root.style.setProperty(
    '--destructive-foreground',
    colors.destructiveForeground,
  )
  root.style.setProperty('--status-todo', colors.statusTodo)
  root.style.setProperty('--status-in-progress', colors.statusInProgress)
  root.style.setProperty('--status-waiting', colors.statusWaiting)
  root.style.setProperty('--status-under-review', colors.statusUnderReview)
  root.style.setProperty('--status-on-hold', colors.statusOnHold)
  root.style.setProperty('--status-blocked', colors.statusBlocked)
  root.style.setProperty('--status-done', colors.statusDone)
  root.style.setProperty('--priority-low', colors.priorityLow)
  root.style.setProperty('--priority-medium', colors.priorityMedium)
  root.style.setProperty('--priority-high', colors.priorityHigh)
  root.style.setProperty('--priority-urgent', colors.priorityUrgent)
  root.style.setProperty('--category-delivery', colors.categoryDelivery)
  root.style.setProperty('--category-hiring', colors.categoryHiring)
  root.style.setProperty('--category-mentoring', colors.categoryMentoring)
  root.style.setProperty(
    '--category-collaboration',
    colors.categoryCollaboration,
  )
  root.style.setProperty('--category-growth', colors.categoryGrowth)
  root.style.setProperty('--category-other', colors.categoryOther)

  // Fonts — override --font-sans (used by Tailwind's font-sans class on body)
  // and --font-heading (used by h1-h6 rule in globals.css)
  // Font values may be var() references (e.g. 'var(--font-lora)') from next/font,
  // which are defined on <body> via className. Resolve them to actual font family
  // names before setting on <html> to avoid nested var() resolution issues.
  if (theme.fonts?.body) {
    const resolved = resolveFontValue(theme.fonts.body)
    root.style.setProperty('--font-sans', `${resolved}, system-ui, sans-serif`)
  } else {
    root.style.removeProperty('--font-sans')
  }
  if (theme.fonts?.heading) {
    const resolved = resolveFontValue(theme.fonts.heading)
    root.style.setProperty(
      '--font-heading',
      `${resolved}, system-ui, sans-serif`,
    )
  } else {
    root.style.removeProperty('--font-heading')
  }
}
