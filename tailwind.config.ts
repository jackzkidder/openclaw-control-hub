import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          1: 'rgb(var(--surface-1) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          3: 'rgb(var(--surface-3) / <alpha-value>)',
          4: 'rgb(var(--surface-4) / <alpha-value>)',
        },
        primary: {
          DEFAULT: '#0F172A',
          dim: '#1E293B',
          glow: 'rgba(15,23,42,0.08)',
          ring: 'rgba(15,23,42,0.2)',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#3B82F6',
          dim: '#2563EB',
          glow: 'rgba(59,130,246,0.12)',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#3B82F6',
          glow: 'rgba(59,130,246,0.12)',
          foreground: '#FFFFFF',
        },
        status: {
          online:  '#10B981',
          warning: '#F59E0B',
          error:   '#EF4444',
          offline: '#9CA3AF',
          idle:    '#6B7280',
          running: '#3B82F6',
        },
        border: {
          DEFAULT: 'rgb(var(--border-rgb) / var(--border-opacity))',
          hover:   'rgb(var(--border-rgb) / var(--border-hover-opacity))',
          active:  'rgba(59,130,246,0.4)',
        },
        background: 'rgb(var(--surface) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT:    'rgb(var(--card-rgb) / var(--card-opacity))',
          foreground: 'rgb(var(--foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT:    'rgb(var(--muted-rgb) / var(--muted-opacity))',
          foreground: 'rgb(var(--muted-fg) / <alpha-value>)',
        },
        destructive: {
          DEFAULT:    '#EF4444',
          foreground: '#fff',
        },
        ring:    'rgba(59,130,246,0.4)',
        input:   'rgb(var(--input-rgb) / var(--input-opacity))',
        popover: {
          DEFAULT:    'rgb(var(--surface-2) / <alpha-value>)',
          foreground: 'rgb(var(--foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'var(--font-dm-sans)', ...fontFamily.sans],
        mono: ['JetBrains Mono', 'Fira Code', ...fontFamily.mono],
      },
      backdropBlur: {
        glass: '12px',
        modal: '24px',
        heavy: '40px',
      },
      boxShadow: {
        glass:       'var(--shadow-glass)',
        'glass-sm':  'var(--shadow-glass-sm)',
        card:        'var(--shadow-card)',
        'card-hover':'var(--shadow-card-hover)',
        modal:       'var(--shadow-modal)',
        glow:        '0 0 20px rgba(59,130,246,0.15)',
        'glow-lg':   '0 0 40px rgba(59,130,246,0.2)',
        'glow-violet':'0 0 20px rgba(167,139,250,0.2)',
        'glow-green':'0 0 20px rgba(16,185,129,0.2)',
        'inner-glow':'inset 0 0 30px rgba(59,130,246,0.04)',
      },
      borderRadius: {
        panel: '16px',
        card:  '12px',
        chip:  '6px',
        xl:    '12px',
        lg:    '8px',
        md:    '6px',
        sm:    '4px',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(59,130,246,0.2)' },
          '50%':       { boxShadow: '0 0 28px rgba(59,130,246,0.5)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(0.8)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'border-flow': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'count-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'pulse-glow':     'pulse-glow 2.5s ease-in-out infinite',
        'pulse-dot':      'pulse-dot 1.8s ease-in-out infinite',
        'fade-in':        'fade-in 0.2s ease-out',
        'slide-up':       'slide-up 0.3s ease-out',
        'slide-down':     'slide-down 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'spin-slow':      'spin-slow 10s linear infinite',
        shimmer:          'shimmer 2s linear infinite',
        'border-flow':    'border-flow 4s ease infinite',
        'count-in':       'count-in 0.4s ease-out',
        float:            'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

export default config
