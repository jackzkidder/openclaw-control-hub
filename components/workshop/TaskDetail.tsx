'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Flame,
  Bot,
  Tag,
  Clock,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Send,
  ListTodo,
  ExternalLink,
} from 'lucide-react'
import { GlowButton } from '@/components/primitives/GlowButton'
import { formatRelativeTime, formatDateTime, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils/formatters'
import type { Task } from '@/lib/openclaw/types'
import { cn } from '@/lib/utils/cn'

// ─── Priority badge config ────────────────────────────────────────────────────

const priorityBadgeConfig = {
  low:      'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  medium:   'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  high:     'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  critical: 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20',
}

const statusBadgeConfig: Record<string, string> = {
  backlog:     'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  todo:        'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  in_progress: 'bg-primary/15 text-primary border border-primary/20',
  review:      'bg-violet-500/15 text-violet-700 dark:text-violet-400 border border-violet-500/20',
  done:        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  cancelled:   'bg-slate-600/15 text-slate-600 dark:text-slate-500 border border-slate-600/20',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 flex items-center justify-center text-muted-foreground/60 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  )
}

// ─── DeployStatus banner ──────────────────────────────────────────────────────

function DeployBanner({ task }: { task: Task }) {
  if (!task.deployedToOpenClaw) return null
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/[0.07] border border-primary/20 mb-4">
      <CheckCircle2 size={13} className="text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-primary font-medium">Deployed to OpenClaw</p>
        {task.openClawTaskId && (
          <p className="text-[10px] text-primary/70 font-mono truncate">ID: {task.openClawTaskId}</p>
        )}
      </div>
    </div>
  )
}

// ─── TaskDetail ───────────────────────────────────────────────────────────────

interface TaskDetailProps {
  task: Task | null
  onClose: () => void
  onDeploy?: (task: Task) => void
}

export function TaskDetail({ task, onClose, onDeploy }: TaskDetailProps) {
  const [deploying, setDeploying]       = useState(false)
  const [queueing, setQueueing]         = useState(false)
  const [deployError, setDeployError]   = useState<string | null>(null)
  const [deploySuccess, setDeploySuccess] = useState(false)

  async function handleDeploy() {
    if (!task) return
    setDeploying(true)
    setDeployError(null)
    setDeploySuccess(false)
    try {
      const res = await fetch('/api/openclaw/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:          'dispatch_task',
          taskTitle:       task.title,
          taskDescription: task.description,
          taskPayload:     { taskId: task.id, priority: task.priority },
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      setDeploySuccess(true)
      onDeploy?.(task)
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  async function handleQueueForHeartbeat() {
    if (!task) return
    setQueueing(true)
    setDeployError(null)
    try {
      const res = await fetch('/api/openclaw/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:      'queue_task',
          taskTitle:   task.title,
          taskPayload: { taskId: task.id },
          runMode:     'next_heartbeat',
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Queue failed')
    } finally {
      setQueueing(false)
    }
  }

  return (
    <AnimatePresence>
      {task && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer"
            className={cn(
              'fixed top-0 right-0 z-50 h-full w-full max-w-md',
              'bg-surface-2/95 backdrop-blur-modal border-l border-[var(--border)]',
              'flex flex-col shadow-modal'
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--border)] flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', priorityBadgeConfig[task.priority])}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusBadgeConfig[task.status] ?? '')}>
                    {STATUS_LABELS[task.status] ?? task.status}
                  </span>
                  {task.deployedToOpenClaw && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                      <ExternalLink size={9} />
                      Deployed
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold text-foreground leading-snug">
                  {task.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--surface-muted)] transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Deploy status banner */}
              <DeployBanner task={task} />

              {/* Description */}
              {task.description ? (
                <div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">No description provided.</p>
              )}

              {/* Detail rows */}
              <div className="space-y-4 pt-1">
                {/* Momentum */}
                <DetailRow icon={<Flame size={14} />} label="Momentum Score">
                  <span className={cn(
                    'font-semibold',
                    task.momentumScore >= 70 ? 'text-amber-600 dark:text-amber-400' :
                    task.momentumScore >= 40 ? 'text-blue-700 dark:text-blue-400' :
                    'text-muted-foreground'
                  )}>
                    {task.momentumScore > 0 ? Math.round(task.momentumScore) : '—'}
                  </span>
                </DetailRow>

                {/* Assigned Agent */}
                <DetailRow icon={<Bot size={14} />} label="Assigned Agent">
                  {task.assignedAgentId ? (
                    <span className="font-mono text-sm text-primary">{task.assignedAgentId}</span>
                  ) : (
                    <span className="text-muted-foreground/50">Unassigned</span>
                  )}
                </DetailRow>

                {/* Created */}
                <DetailRow icon={<CalendarDays size={14} />} label="Created">
                  <span title={formatDateTime(task.createdAt)}>
                    {formatRelativeTime(task.createdAt)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formatDateTime(task.createdAt)})
                  </span>
                </DetailRow>

                {/* Updated */}
                <DetailRow icon={<Clock size={14} />} label="Last Updated">
                  <span title={formatDateTime(task.updatedAt)}>
                    {formatRelativeTime(task.updatedAt)}
                  </span>
                </DetailRow>

                {/* Completed */}
                {task.completedAt && (
                  <DetailRow icon={<CheckCircle2 size={14} />} label="Completed">
                    <span title={formatDateTime(task.completedAt)}>
                      {formatRelativeTime(task.completedAt)}
                    </span>
                  </DetailRow>
                )}

                {/* Tags */}
                {task.tags.length > 0 && (
                  <DetailRow icon={<Tag size={14} />} label="Tags">
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full text-[var(--text-muted)] bg-[var(--surface-muted)] border border-[var(--border)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </DetailRow>
                )}
              </div>

              {/* Error feedback */}
              {deployError && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <AlertCircle size={13} className="text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive">{deployError}</p>
                </motion.div>
              )}

              {/* Success feedback */}
              {deploySuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                >
                  <CheckCircle2 size={13} className="text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Successfully deployed to OpenClaw</p>
                </motion.div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border)] space-y-2">
              <GlowButton
                variant="primary"
                size="sm"
                className="w-full"
                icon={<Send size={13} />}
                loading={deploying}
                disabled={deploying || queueing || deploySuccess}
                onClick={handleDeploy}
              >
                {deploySuccess ? 'Deployed!' : 'Deploy to OpenClaw'}
              </GlowButton>

              <GlowButton
                variant="secondary"
                size="sm"
                className="w-full"
                icon={<ListTodo size={13} />}
                loading={queueing}
                disabled={deploying || queueing}
                onClick={handleQueueForHeartbeat}
              >
                Queue for Heartbeat
              </GlowButton>

              <GlowButton
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={onClose}
              >
                Close
              </GlowButton>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
