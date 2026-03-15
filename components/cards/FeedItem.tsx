'use client'

import { motion } from 'framer-motion'
import { Activity, Bot, Zap, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime } from '@/lib/utils/formatters'

interface FeedItemProps {
  event: {
    id: string
    type: string
    agentId?: string
    summary: string
    timestamp: string
  }
  delay?: number
}

const typeConfig: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  heartbeat:               { icon: Activity,      color: 'text-primary',       bg: 'bg-primary/10' },
  'agent.status_changed':  { icon: Bot,           color: 'text-secondary',     bg: 'bg-secondary/10' },
  'agent.message':         { icon: Bot,           color: 'text-secondary',     bg: 'bg-secondary/10' },
  'agent.tool_call':       { icon: Zap,           color: 'text-amber-400',     bg: 'bg-amber-500/10' },
  'agent.error':           { icon: AlertTriangle, color: 'text-status-error',  bg: 'bg-status-error/10' },
  'task.completed':        { icon: CheckCircle2,  color: 'text-status-online', bg: 'bg-status-online/10' },
  'gateway.connected':     { icon: CheckCircle2,  color: 'text-status-online', bg: 'bg-status-online/10' },
  'gateway.disconnected':  { icon: AlertTriangle, color: 'text-status-warning',bg: 'bg-status-warning/10' },
  default:                 { icon: Clock,         color: 'text-muted-foreground',bg: 'bg-white/[0.05]' },
}

export function FeedItem({ event, delay = 0 }: FeedItemProps) {
  const config = typeConfig[event.type] ?? typeConfig.default
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
    >
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', config.bg)}>
        <Icon size={13} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground/90 leading-relaxed">{event.summary}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground/50">{event.type}</span>
          {event.agentId && (
            <span className="text-[10px] text-muted-foreground/50">· {event.agentId}</span>
          )}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground/40 flex-shrink-0 mt-0.5">
        {formatRelativeTime(event.timestamp)}
      </span>
    </motion.div>
  )
}
