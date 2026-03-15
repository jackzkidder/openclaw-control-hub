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
          DEFAULT: '#22d3ee',
          dim: '#0e7490',
          glow: 'rgba(34,211,238,0.15)',
          ring: 'rgba(34,211,238,0.4)',
          foreground: '#080810',
        },
        secondary: {
          DEFAULT: '#a78bfa',
          dim: '#5b21b6',
          glow: 'rgba(167,139,250,0.15)',
          foreground: '#080810',
        },
        accent: {
          DEFAULT: '#f472b6',
          glow: 'rgba(244,114,182,0.15)',
          foreground: '#080810',
        },
        status: {
          online: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          offline: '#4b5563',
          idle: '#8b5cf6',
          running: '#22d3ee',
        },
        border: {
          DEFAULT: 'rgb(var(--border-rgb) / var(--border-opacity))',
          hover: 'rgb(var(--border-rgb) / var(--border-hover-opacity))',
          active: 'rgba(34,211,238,0.35)',
        },
        background: 'rgb(var(--surface) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card-rgb) / var(--card-opacity))',
          foreground: 'rgb(var(--foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted-rgb) / var(--muted-opacity))',
          foreground: 'rgb(var(--muted-fg) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#fff',
        },
        ring: 'rgba(34,211,238,0.4)',
        input: 'rgb(var(--input-rgb) / var(--input-opacity))',
        popover: {
          DEFAULT: 'rgb(var(--surface-2) / <alpha-value>)',
          foreground: 'rgb(var(--foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
        mono: ['JetBrains Mono', 'Fira Code', ...fontFamily.mono],
      },
      backdropBlur: {
        glass: '12px',
        modal: '24px',
        heavy: '40px',
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        'glass-sm': 'var(--shadow-glass-sm)',
        glow: '0 0 20px rgba(34,211,238,0.2)',
        'glow-lg': '0 0 40px rgba(34,211,238,0.25), 0 0 80px rgba(34,211,238,0.08)',
        'glow-violet': '0 0 20px rgba(167,139,250,0.2)',
        'glow-green': '0 0 20px rgba(16,185,129,0.2)',
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
        'inner-glow': 'inset 0 0 30px rgba(34,211,238,0.05)',
      },
      borderRadius: {
        panel: '16px',
        card: '12px',
        chip: '6px',
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34,211,238,0.3)' },
          '50%': { boxShadow: '0 0 28px rgba(34,211,238,0.7)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'count-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.35s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'spin-slow': 'spin-slow 10s linear infinite',
        shimmer: 'shimmer 2s linear infinite',
        'border-flow': 'border-flow 4s ease infinite',
        'count-in': 'count-in 0.4s ease-out',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

export default config
