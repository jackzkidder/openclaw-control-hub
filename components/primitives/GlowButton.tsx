'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { ButtonHTMLAttributes } from 'react'

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ duration: 0.15 }}
        disabled={disabled || loading}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          // sizes
          size === 'sm' && 'px-3 py-1.5 text-xs',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          // variants
          variant === 'primary' && [
            'bg-primary text-surface font-semibold',
            'shadow-glow hover:shadow-glow-lg',
            'hover:bg-primary/90',
          ],
          variant === 'secondary' && [
            'bg-secondary/20 text-secondary border border-secondary/30',
            'hover:bg-secondary/30 hover:shadow-glow-violet',
          ],
          variant === 'outline' && [
            'bg-white/[0.04] text-foreground border border-white/[0.12]',
            'hover:bg-white/[0.08] hover:border-white/[0.2]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-foreground/70',
            'hover:bg-white/[0.06] hover:text-foreground',
          ],
          variant === 'danger' && [
            'bg-destructive/20 text-destructive border border-destructive/30',
            'hover:bg-destructive/30',
          ],
          className
        )}
        {...(props as React.ComponentPropsWithRef<typeof motion.button>)}
      >
        {loading ? (
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
      </motion.button>
    )
  }
)
GlowButton.displayName = 'GlowButton'
