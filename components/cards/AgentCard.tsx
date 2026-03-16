'use client'

import { motion } from 'framer-motion'
import { Bot, Activity, Clock } from 'lucide-react'
import { PulseIndicator } from '@/components/primitives/PulseIndicator'
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
      <div
        className="rounded-xl p-5 cursor-pointer transition-all duration-150"
        style={{
          background: 'var(--surface)',
          border: agent.status === 'running'
            ? '1px solid rgba(37,99,235,0.25)'
            : agent.status === 'error'
            ? '1px solid rgba(220,38,38,0.2)'
            : '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-panel)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'
        }}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
            >
              <Bot
                size={18}
                style={{ color: agent.status === 'running' ? 'var(--info)' : 'var(--text-quiet)' }}
              />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{agent.name}</p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{agent.model}</p>
            </div>
          </div>
          <PulseIndicator color={pulseColor} size="sm" pulse={agent.status === 'running'} />
        </div>

        {agent.description && (
          <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{agent.description}</p>
        )}

        {agent.currentTask && (
          <div
            className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg"
            style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}
          >
            <Activity size={11} className="flex-shrink-0" style={{ color: 'var(--info)' }} />
            <p className="text-xs line-clamp-1" style={{ color: 'var(--info)' }}>{agent.currentTask}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-quiet)' }}>
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>{formatRelativeTime(agent.lastActiveAt)}</span>
          </div>
          {agent.tokensUsed.inputTokens > 0 && (
            <span>{formatTokenCount(agent.tokensUsed.inputTokens + agent.tokensUsed.outputTokens)} tokens</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
