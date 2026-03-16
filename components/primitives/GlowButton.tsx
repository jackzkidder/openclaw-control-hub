'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'
import type { ButtonHTMLAttributes } from 'react'

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, style, ...props }, ref) => {
    const variantStyles: Record<string, React.CSSProperties> = {
      primary:   { background: 'var(--text)', color: 'var(--surface)' },
      secondary: { background: 'var(--surface-muted)', color: 'var(--text)', border: '1px solid var(--border)' },
      outline:   { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' },
      ghost:     { background: 'transparent', color: 'var(--text-muted)' },
      danger:    { background: 'var(--danger)', color: '#fff' },
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none hover:opacity-90',
          size === 'sm' && 'px-3 py-1.5 text-xs',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          className
        )}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {loading ? (
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          icon
        )}
        {children}
      </button>
    )
  }
)
GlowButton.displayName = 'GlowButton'
