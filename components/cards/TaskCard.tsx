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
  low:      { color: 'bg-slate-500/20 text-slate-400',  dot: 'bg-slate-500' },
  medium:   { color: 'bg-blue-500/20 text-blue-400',    dot: 'bg-blue-500' },
  high:     { color: 'bg-amber-500/20 text-amber-400',  dot: 'bg-amber-500' },
  critical: { color: 'bg-red-500/20 text-red-400',      dot: 'bg-red-500' },
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
      className={cn(
        'group cursor-pointer rounded-card p-3.5 mb-2',
        'bg-white/[0.03] border border-white/[0.07]',
        'hover:bg-white/[0.05] hover:border-white/[0.12]',
        'transition-all duration-150',
        isDragging && 'shadow-glow ring-1 ring-primary/30',
        task.deployedToOpenClaw && 'border-primary/15'
      )}
    >
      {/* Priority + deployed badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full', pCfg.color)}>
          <span className={cn('w-1 h-1 rounded-full', pCfg.dot)} />
          {task.priority}
        </span>
        <div className="flex items-center gap-1.5">
          {task.momentumScore > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
              <Flame size={9} />
              {Math.round(task.momentumScore)}
            </span>
          )}
          {task.deployedToOpenClaw && (
            <span className="text-[10px] text-primary font-medium">Deployed</span>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-2">
        {task.title}
      </p>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-muted-foreground">
              <Tag size={8} />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-muted-foreground">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 pt-1.5 border-t border-white/[0.04]">
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
