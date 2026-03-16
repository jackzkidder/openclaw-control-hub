'use client'

import { motion } from 'framer-motion'
import { Activity, Bot, Zap, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
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

type EventConfig = { icon: typeof Activity; iconColor: string; bgColor: string }

const typeConfig: Record<string, EventConfig> = {
  heartbeat:               { icon: Activity,      iconColor: 'var(--info)',    bgColor: 'rgba(37,99,235,0.08)' },
  'agent.status_changed':  { icon: Bot,           iconColor: 'var(--info)',    bgColor: 'rgba(37,99,235,0.08)' },
  'agent.message':         { icon: Bot,           iconColor: 'var(--info)',    bgColor: 'rgba(37,99,235,0.08)' },
  'agent.tool_call':       { icon: Zap,           iconColor: 'var(--warning)', bgColor: 'rgba(217,119,6,0.08)' },
  'agent.error':           { icon: AlertTriangle, iconColor: 'var(--danger)',  bgColor: 'rgba(220,38,38,0.08)' },
  'task.completed':        { icon: CheckCircle2,  iconColor: 'var(--success)', bgColor: 'rgba(22,163,74,0.08)' },
  'gateway.connected':     { icon: CheckCircle2,  iconColor: 'var(--success)', bgColor: 'rgba(22,163,74,0.08)' },
  'gateway.disconnected':  { icon: AlertTriangle, iconColor: 'var(--warning)', bgColor: 'rgba(217,119,6,0.08)' },
  default:                 { icon: Clock,         iconColor: 'var(--text-quiet)', bgColor: 'var(--surface-muted)' },
}

export function FeedItem({ event, delay = 0 }: FeedItemProps) {
  const config = typeConfig[event.type] ?? typeConfig.default
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex items-start gap-3 py-3 px-6"
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: config.bgColor }}
      >
        <Icon size={13} style={{ color: config.iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{event.summary}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px]" style={{ color: 'var(--text-quiet)' }}>{event.type}</span>
          {event.agentId && (
            <span className="text-[10px]" style={{ color: 'var(--text-quiet)' }}>· {event.agentId}</span>
          )}
        </div>
      </div>
      <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: 'var(--text-quiet)' }}>
        {formatRelativeTime(event.timestamp)}
      </span>
    </motion.div>
  )
}
