import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic colors using CSS variables
        background: 'var(--background)',
        foreground: 'var(--text-primary)',
        card: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--text-primary)',
        },
        popover: {
          DEFAULT: 'var(--surface-2)',
          foreground: 'var(--text-primary)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--surface-2)',
          foreground: 'var(--text-primary)',
        },
        muted: {
          DEFAULT: 'var(--surface-2)',
          foreground: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border-color)',
        input: 'var(--border-color)',
        ring: 'var(--primary)',
        sidebar: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--text-primary)',
          border: 'var(--border-color)',
          accent: 'var(--primary)',
          'accent-foreground': 'var(--primary-foreground)',
        },
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-in': 'slide-in-from-left 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
