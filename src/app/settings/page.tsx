'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor, Palette } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const themes = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Classic light theme with warm Anthropic colors',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme for reduced eye strain',
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Automatically match your system preferences',
    },
  ]

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-2xl space-y-8">
        {/* Appearance */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          </div>
          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred color scheme
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {themes.map((t) => {
                const Icon = t.icon
                const isSelected = mounted && theme === t.value

                return (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      'relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all hover:border-primary/50',
                      isSelected && 'border-primary bg-primary/5 ring-1 ring-primary'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-lg p-2',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">About</h2>
          <Separator />

          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div>
              <h3 className="font-medium text-foreground">AI Focus</h3>
              <p className="text-sm text-muted-foreground">Version 0.1.0</p>
            </div>
            <p className="text-sm text-muted-foreground">
              A modern, minimal productivity app built with Next.js,
              PostgreSQL, and styled with Anthropic&apos;s brand colors.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Next.js 14
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                TypeScript
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                PostgreSQL
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Prisma
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Tailwind CSS
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
