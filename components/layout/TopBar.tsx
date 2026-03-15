'use client'

import { motion } from 'framer-motion'
import { ConnectionBadge } from '@/components/badges/ConnectionBadge'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { formatLatency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function TopBar({ title, subtitle, actions, className }: TopBarProps) {
  const { status, latencyMs } = useConnectionStatus()

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-center justify-between',
        'h-16 px-6 border-b border-white/[0.06]',
        'bg-surface-1/60 backdrop-blur-glass flex-shrink-0',
        className
      )}
    >
      <div>
        <h1 className="text-lg font-semibold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <ConnectionBadge
          status={status}
          latencyMs={latencyMs}
          showLatency
        />
      </div>
    </motion.header>
  )
}
