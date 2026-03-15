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
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'relative rounded-panel border transition-all duration-200 backdrop-blur-glass',
        variant === 'default' && 'glass-panel shadow-glass',
        variant === 'elevated' && 'glass-panel-elevated shadow-glass',
        variant === 'subtle' && 'glass-panel-subtle',
        variant === 'bordered' && 'glass-panel shadow-glass',
        !noPadding && 'p-5',
        glow && glowColor === 'cyan' && 'shadow-glow',
        glow && glowColor === 'violet' && 'shadow-glow-violet',
        glow && glowColor === 'green' && 'shadow-glow-green',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
