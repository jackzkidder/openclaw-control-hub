'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils/cn'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function TopBar({ title, subtitle, actions, className }: TopBarProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header
      className={cn('flex items-center justify-between h-14 px-8 flex-shrink-0', className)}
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <h1 className="text-lg font-semibold leading-tight" style={{ color: 'var(--text)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface-muted)' }}
        >
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>U</span>
        </div>
      </div>
    </header>
  )
}
