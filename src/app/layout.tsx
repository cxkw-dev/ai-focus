import type { Metadata, Viewport } from 'next'
import { DM_Mono, Figtree, Outfit } from 'next/font/google'
import { ThemeScript } from 'dawn-and-dusk/theme'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'
import { EvalStatus } from '@/components/ui/eval-pill'
import './globals.css'

// dawn & dusk's three families, self-hosted by next/font. globals.css points the system's font tokens at them.
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-outfit',
})

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-figtree',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: 'ai-focus',
  description: 'A quiet place for todos, notes and the year in review',
  manifest: '/manifest.json?v=8',
  icons: {
    icon: [
      { url: '/favicon.png?v=8', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png?v=8', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico?v=8', sizes: 'any' },
    ],
    shortcut: [{ url: '/favicon.ico?v=8' }],
    apple: [
      { url: '/apple-touch-icon.png?v=8', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Focus',
  },
  formatDetection: {
    telephone: false,
  },
}

// The browser chrome takes the page tone of each theme (--dd-bg in dawn and dusk).
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4efe7' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1916' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // ThemeScript restores the saved dawn/dusk choice onto <html data-theme> before hydration.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${figtree.variable} ${dmMono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <QueryProvider>
          {children}
          <Toaster />
          <EvalStatus />
        </QueryProvider>
      </body>
    </html>
  )
}
