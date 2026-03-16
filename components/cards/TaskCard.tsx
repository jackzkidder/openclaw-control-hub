'use client'

import { motion } from 'framer-motion'
import { Bot, Flame, Calendar, Tag } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime } from '@/lib/utils/formatters'
import type { Task } from '@/lib/openclaw/types'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  isDragging?: boolean
}

const priorityConfig = {
  low:      { label: 'low',      dotColor: 'var(--text-quiet)',  bg: 'var(--surface-muted)', color: 'var(--text-muted)' },
  medium:   { label: 'medium',   dotColor: 'var(--info)',         bg: 'rgba(29,78,216,0.08)', color: 'var(--info)' },
  high:     { label: 'high',     dotColor: 'var(--warning)',      bg: 'rgba(180,83,9,0.08)',  color: 'var(--warning)' },
  critical: { label: 'critical', dotColor: 'var(--danger)',       bg: 'rgba(185,28,28,0.08)', color: 'var(--danger)' },
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const pCfg = priorityConfig[task.priority]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="cursor-pointer rounded-lg p-3.5 mb-2 transition-all duration-150"
      style={{
        background: 'var(--surface)',
        border: task.deployedToOpenClaw
          ? '1px solid rgba(29,78,216,0.2)'
          : '1px solid var(--border)',
        boxShadow: isDragging ? 'var(--shadow-lifted)' : 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lifted)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDragging ? 'var(--shadow-lifted)' : 'var(--shadow-card)'
      }}
    >
      {/* Priority + deployed badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: pCfg.bg, color: pCfg.color }}
        >
          <span className="w-1 h-1 rounded-full" style={{ background: pCfg.dotColor }} />
          {pCfg.label}
        </span>
        <div className="flex items-center gap-1.5">
          {task.momentumScore > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--warning)' }}>
              <Flame size={9} />
              {Math.round(task.momentumScore)}
            </span>
          )}
          {task.deployedToOpenClaw && (
            <span className="text-[10px] font-medium" style={{ color: 'var(--info)' }}>Deployed</span>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium line-clamp-2 leading-snug mb-2" style={{ color: 'var(--text)' }}>
        {task.title}
      </p>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              <Tag size={8} />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--surface-muted)', color: 'var(--text-quiet)' }}
            >
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between text-[10px] pt-1.5"
        style={{ color: 'var(--text-quiet)', borderTop: '1px solid var(--border)' }}
      >
        {task.assignedAgentId ? (
          <span className="flex items-center gap-1">
            <Bot size={9} />
            {task.assignedAgentId}
          </span>
        ) : (
          <span>Unassigned</span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={9} />
          {formatRelativeTime(task.updatedAt)}
        </span>
      </div>
    </motion.div>
  )
}
