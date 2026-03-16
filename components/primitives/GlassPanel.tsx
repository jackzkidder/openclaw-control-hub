import { cn } from '@/lib/utils/cn'
import type { HTMLAttributes } from 'react'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle' | 'bordered'
  glow?: boolean
  glowColor?: 'cyan' | 'violet' | 'green' | 'rose'
  noPadding?: boolean
}

export function GlassPanel({
  className,
  variant = 'default',
  glow = false,
  glowColor = 'cyan',
  noPadding = false,
  children,
  style,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl border transition-all duration-200',
        !noPadding && 'p-5',
        className
      )}
      style={{
        background: variant === 'subtle' ? 'var(--surface-muted)' : 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: variant === 'elevated' ? 'var(--shadow-panel)' : 'var(--shadow-card)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
