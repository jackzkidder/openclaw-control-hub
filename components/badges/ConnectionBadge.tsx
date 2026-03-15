'use client'

import { motion } from 'framer-motion'
import { PulseIndicator } from '@/components/primitives/PulseIndicator'
import { cn } from '@/lib/utils/cn'
import type { ConnectionStatus } from '@/lib/openclaw/types'

const statusConfig: Record<
  ConnectionStatus,
  { label: string; color: 'green' | 'cyan' | 'amber' | 'red' | 'gray'; pulse: boolean }
> = {
  connected:    { label: 'Connected',    color: 'green',  pulse: true },
  connecting:   { label: 'Connecting',   color: 'cyan',   pulse: true },
  reconnecting: { label: 'Reconnecting', color: 'amber',  pulse: true },
  disconnected: { label: 'Disconnected', color: 'gray',   pulse: false },
  error:        { label: 'Error',        color: 'red',    pulse: false },
}

interface ConnectionBadgeProps {
  status: ConnectionStatus
  latencyMs?: number | null
  className?: string
  showLatency?: boolean
}

export function ConnectionBadge({ status, latencyMs, className, showLatency = false }: ConnectionBadgeProps) {
  const config = statusConfig[status]

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-white/[0.04] border border-white/[0.08]',
        'text-xs font-medium',
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <PulseIndicator color={config.color} size="sm" pulse={config.pulse} />
      <span className="text-foreground/80">{config.label}</span>
      {showLatency && latencyMs !== null && latencyMs !== undefined && status === 'connected' && (
        <span className="text-muted-foreground ml-0.5">{latencyMs}ms</span>
      )}
    </motion.div>
  )
}
