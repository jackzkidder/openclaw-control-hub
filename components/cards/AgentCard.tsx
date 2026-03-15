'use client'

import { motion } from 'framer-motion'
import { Bot, Activity, Clock } from 'lucide-react'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { PulseIndicator } from '@/components/primitives/PulseIndicator'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime, formatTokenCount } from '@/lib/utils/formatters'
import type { Agent } from '@/lib/openclaw/types'

interface AgentCardProps {
  agent: Agent
  onClick?: () => void
  delay?: number
}

const statusColorMap: Record<Agent['status'], 'green' | 'cyan' | 'amber' | 'red' | 'gray' | 'violet'> = {
  idle:    'gray',
  running: 'cyan',
  paused:  'violet',
  error:   'red',
  offline: 'gray',
}

export function AgentCard({ agent, onClick, delay = 0 }: AgentCardProps) {
  const pulseColor = statusColorMap[agent.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
    >
      <GlassPanel
        className={cn(
          'cursor-pointer hover:border-white/[0.15] transition-all',
          agent.status === 'running' && 'border-primary/20 shadow-glow',
          agent.status === 'error' && 'border-status-error/20'
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              'bg-white/[0.05] border border-white/[0.08]'
            )}>
              <Bot size={18} className={agent.status === 'running' ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{agent.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{agent.model}</p>
            </div>
          </div>
          <PulseIndicator color={pulseColor} size="sm" pulse={agent.status === 'running'} />
        </div>

        {agent.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{agent.description}</p>
        )}

        {agent.currentTask && (
          <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-primary/[0.07] border border-primary/20">
            <Activity size={11} className="text-primary flex-shrink-0" />
            <p className="text-xs text-primary line-clamp-1">{agent.currentTask}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>{formatRelativeTime(agent.lastActiveAt)}</span>
          </div>
          {agent.tokensUsed.inputTokens > 0 && (
            <span>{formatTokenCount(agent.tokensUsed.inputTokens + agent.tokensUsed.outputTokens)} tokens</span>
          )}
        </div>
      </GlassPanel>
    </motion.div>
  )
}
