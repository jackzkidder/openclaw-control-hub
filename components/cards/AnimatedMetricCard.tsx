'use client'

import { motion } from 'framer-motion'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface AnimatedMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: { value: number; label: string }
  accent?: 'cyan' | 'violet' | 'green' | 'amber' | 'rose'
  loading?: boolean
  className?: string
  delay?: number
}

const accentMap = {
  cyan:   { icon: 'text-primary',        bg: 'bg-primary/10',       border: 'border-primary/20' },
  violet: { icon: 'text-secondary',      bg: 'bg-secondary/10',     border: 'border-secondary/20' },
  green:  { icon: 'text-status-online',  bg: 'bg-status-online/10', border: 'border-status-online/20' },
  amber:  { icon: 'text-status-warning', bg: 'bg-status-warning/10',border: 'border-status-warning/20' },
  rose:   { icon: 'text-accent',         bg: 'bg-accent/10',        border: 'border-accent/20' },
}

export function AnimatedMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'cyan',
  trend,
  loading = false,
  className,
  delay = 0,
}: AnimatedMetricCardProps) {
  const colors = accentMap[accent]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      <GlassPanel className="flex flex-col gap-3 hover:border-white/[0.12] transition-colors cursor-default">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          {Icon && (
            <div className={cn('p-2 rounded-lg', colors.bg, 'border', colors.border)}>
              <Icon size={14} className={colors.icon} />
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-24 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-16 rounded bg-white/[0.04] animate-pulse" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: delay + 0.1 }}
          >
            <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </motion.div>
        )}

        {trend && !loading && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend.value >= 0 ? 'text-status-online' : 'text-status-error'
          )}>
            <span>{trend.value >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}% {trend.label}</span>
          </div>
        )}
      </GlassPanel>
    </motion.div>
  )
}
