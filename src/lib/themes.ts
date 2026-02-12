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
  statusOnHold: string
  statusDone: string

  // Priority colors
  priorityLow: string
  priorityMedium: string
  priorityHigh: string
  priorityUrgent: string
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
      statusOnHold: '#FF7D8C',
      statusDone: '#7DD3A8',

      // Priority colors
      priorityLow: '#C9B6AE',
      priorityMedium: '#FFCB8E',
      priorityHigh: '#FFB199',
      priorityUrgent: '#FF6B6B',
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
      statusOnHold: '#EB459E',
      statusDone: '#57F287',

      // Priority colors
      priorityLow: '#949BA4',
      priorityMedium: '#FEE75C',
      priorityHigh: '#F0B232',
      priorityUrgent: '#ED4245',
    },
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Warm terracotta tones',
    fonts: {
      heading: 'var(--font-lora)',
      body: 'var(--font-dm-sans)',
    },
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
      statusOnHold: '#BC6C5A',
      statusDone: '#8FB67A',

      // Priority colors
      priorityLow: '#A39990',
      priorityMedium: '#DDA15E',
      priorityHigh: '#D97757',
      priorityUrgent: '#DC4C4C',
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
      statusOnHold: '#C678DD',
      statusDone: '#98C379',

      // Priority colors
      priorityLow: '#7F848E',
      priorityMedium: '#E5C07B',
      priorityHigh: '#D19A66',
      priorityUrgent: '#E06C75',
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
      statusOnHold: '#9A5CCF',
      statusDone: '#7AD4A0',

      // Priority colors
      priorityLow: '#6B7A8D',
      priorityMedium: '#DF740C',
      priorityHigh: '#E8A54B',
      priorityUrgent: '#DF3B57',
    },
  },
]

export const defaultTheme = themes[0]

export function getThemeById(id: string): Theme {
  return themes.find(t => t.id === id) || defaultTheme
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
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground)
  root.style.setProperty('--status-todo', colors.statusTodo)
  root.style.setProperty('--status-in-progress', colors.statusInProgress)
  root.style.setProperty('--status-waiting', colors.statusWaiting)
  root.style.setProperty('--status-on-hold', colors.statusOnHold)
  root.style.setProperty('--status-done', colors.statusDone)
  root.style.setProperty('--priority-low', colors.priorityLow)
  root.style.setProperty('--priority-medium', colors.priorityMedium)
  root.style.setProperty('--priority-high', colors.priorityHigh)
  root.style.setProperty('--priority-urgent', colors.priorityUrgent)

  // Fonts — override --font-sans (used by Tailwind's font-sans class on body)
  // and --font-heading (used by h1-h6 rule in globals.css)
  if (theme.fonts?.body) {
    root.style.setProperty('--font-sans', `${theme.fonts.body}, system-ui, sans-serif`)
  } else {
    root.style.removeProperty('--font-sans')
  }
  if (theme.fonts?.heading) {
    root.style.setProperty('--font-heading', `${theme.fonts.heading}, system-ui, sans-serif`)
  } else {
    root.style.removeProperty('--font-heading')
  }
}
