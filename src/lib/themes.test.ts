import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, defaultTheme, getThemeById, themes } from '@/lib/themes'

describe('getThemeById', () => {
  it('returns the requested theme', () => {
    const discord = themes.find((t) => t.id === 'discord')!
    expect(getThemeById('discord')).toBe(discord)
  })
  it('falls back to the default theme when id is unknown', () => {
    expect(getThemeById('nonexistent')).toBe(defaultTheme)
  })
})

describe('applyTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style')
    document.body.removeAttribute('style')
  })
  afterEach(() => {
    document.documentElement.removeAttribute('style')
    document.body.removeAttribute('style')
    vi.restoreAllMocks()
  })

  it('writes every color CSS variable', () => {
    applyTheme(defaultTheme)
    const root = document.documentElement
    expect(root.style.getPropertyValue('--background')).toBe(
      defaultTheme.colors.background,
    )
    expect(root.style.getPropertyValue('--primary')).toBe(
      defaultTheme.colors.primary,
    )
    expect(root.style.getPropertyValue('--status-in-progress')).toBe(
      defaultTheme.colors.statusInProgress,
    )
    expect(root.style.getPropertyValue('--priority-urgent')).toBe(
      defaultTheme.colors.priorityUrgent,
    )
  })

  it('removes font overrides when theme has no fonts', () => {
    document.documentElement.style.setProperty('--font-sans', 'LEAK')
    document.documentElement.style.setProperty('--font-heading', 'LEAK')
    applyTheme(defaultTheme)
    expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe(
      '',
    )
    expect(
      document.documentElement.style.getPropertyValue('--font-heading'),
    ).toBe('')
  })

  it('resolves a var() reference via getComputedStyle', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) =>
        name === '--font-inconsolata' ? '"Inconsolata Mock"' : '',
    } as unknown as CSSStyleDeclaration)

    const tron = themes.find((t) => t.id === 'tron-legacy')!
    applyTheme(tron)

    expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe(
      '"Inconsolata Mock", system-ui, sans-serif',
    )
  })

  it('keeps the raw value when var() cannot be resolved', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration)

    applyTheme({
      ...defaultTheme,
      fonts: { body: 'var(--font-missing)' },
    })

    expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe(
      'var(--font-missing), system-ui, sans-serif',
    )
  })
})
