import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import {
  DM_Sans,
  Inconsolata,
  Inter,
  Lora,
  Pixelify_Sans,
} from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'
import { EvalStatus } from '@/components/ui/eval-pill'
import './globals.css'

const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-pixelify',
})

const inconsolata = Inconsolata({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inconsolata',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lora',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'ai-focus',
  description: 'A modern, minimal productivity app',
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

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFD3AC' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0B' },
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${pixelifySans.variable} ${inconsolata.variable} ${lora.variable} ${dmSans.variable} ${inter.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <EvalStatus />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
