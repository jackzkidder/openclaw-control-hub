'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Flame, Bot, Tag, Clock, CalendarDays, CheckCircle2, AlertCircle,
  Send, ListTodo, ExternalLink, MessageSquare, History, Trash2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GlowButton } from '@/components/primitives/GlowButton'
import { formatRelativeTime, formatDateTime, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils/formatters'
import type { Task, Note, TaskHistoryEntry } from '@/lib/openclaw/types'
import { cn } from '@/lib/utils/cn'
import { useUpdateTask } from '@/hooks/useTasks'

// ─── Badge configs ─────────────────────────────────────────────────────────────

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

// ─── Sub-components ────────────────────────────────────────────────────────────

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ color: 'var(--text-quiet)' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-quiet)' }}>{label}</p>
        <div className="text-sm" style={{ color: 'var(--text)' }}>{children}</div>
      </div>
    </div>
  )
}

function DeployBanner({ task }: { task: Task }) {
  if (!task.deployedToOpenClaw) return null
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ background: 'rgba(29,78,216,0.07)', border: '1px solid rgba(29,78,216,0.2)' }}>
      <CheckCircle2 size={13} className="text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-primary font-medium">Deployed to OpenClaw</p>
        {task.openClawTaskId && (
          <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>ID: {task.openClawTaskId}</p>
        )}
      </div>
    </div>
  )
}

// ─── Comments Tab ──────────────────────────────────────────────────────────────

function CommentsTab({ taskId }: { taskId: string }) {
  const qc = useQueryClient()
  const [text, setText] = useState('')

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes', 'task', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/notes?entityType=task&entityId=${taskId}`)
      if (!res.ok) throw new Error('Failed to fetch notes')
      return res.json()
    },
  })

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'task', entityId: taskId, content }),
      })
      if (!res.ok) throw new Error('Failed to add comment')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', 'task', taskId] })
      setText('')
    },
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', 'task', taskId] }),
  })

  return (
    <div className="space-y-3">
      {notes.length === 0 && (
        <div className="text-center py-8 rounded-lg" style={{ border: '2px dashed var(--border)', background: 'var(--surface-muted)' }}>
          <MessageSquare size={20} className="mx-auto mb-2" style={{ color: 'var(--text-quiet)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No comments yet</p>
        </div>
      )}
      {notes.map((note) => (
        <div key={note.id} className="group flex gap-2.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            N
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[10px]" style={{ color: 'var(--text-quiet)' }}>{formatRelativeTime(note.createdAt)}</span>
              <button
                onClick={() => deleteNote.mutate(note.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                style={{ color: 'var(--text-quiet)' }}
              >
                <Trash2 size={11} />
              </button>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{note.content}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="flex-1 text-sm rounded-lg px-3 py-2 resize-none"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--text)' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) {
              addNote.mutate(text.trim())
            }
          }}
        />
        <GlowButton
          variant="primary"
          size="sm"
          disabled={!text.trim() || addNote.isPending}
          onClick={() => addNote.mutate(text.trim())}
        >
          Add
        </GlowButton>
      </div>
    </div>
  )
}

// ─── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab({ taskId }: { taskId: string }) {
  const { data: history = [] } = useQuery<TaskHistoryEntry[]>({
    queryKey: ['task-history', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/history?taskId=${taskId}`)
      if (!res.ok) throw new Error('Failed to fetch history')
      return res.json()
    },
  })

  if (history.length === 0) {
    return (
      <div className="text-center py-8 rounded-lg" style={{ border: '2px dashed var(--border)', background: 'var(--surface-muted)' }}>
        <History size={20} className="mx-auto mb-2" style={{ color: 'var(--text-quiet)' }} />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No changes recorded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {history.map((entry) => (
        <div key={entry.id} className="flex items-start gap-2.5 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--accent-blue)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: 'var(--text)' }}>
              <span className="font-medium">{entry.field}</span> changed
              {entry.oldValue && <span style={{ color: 'var(--text-muted)' }}> from <span className="font-mono">{entry.oldValue}</span></span>}
              {entry.newValue && <span> to <span className="font-mono font-medium">{entry.newValue}</span></span>}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-quiet)' }}>{formatRelativeTime(entry.changedAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── TaskDetail ────────────────────────────────────────────────────────────────

interface TaskDetailProps {
  task: Task | null
  onClose: () => void
  onDeploy?: (task: Task) => void
}

type Tab = 'details' | 'comments' | 'history'

export function TaskDetail({ task, onClose, onDeploy }: TaskDetailProps) {
  const [deploying, setDeploying]         = useState(false)
  const [queueing, setQueueing]           = useState(false)
  const [deployError, setDeployError]     = useState<string | null>(null)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [activeTab, setActiveTab]         = useState<Tab>('details')
  const updateTask = useUpdateTask()

  async function handleDeploy() {
    if (!task) return
    setDeploying(true); setDeployError(null); setDeploySuccess(false)
    try {
      const res = await fetch('/api/openclaw/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch_task', taskTitle: task.title,
          taskDescription: task.description, taskPayload: { taskId: task.id, priority: task.priority },
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      setDeploySuccess(true); onDeploy?.(task)
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  async function handleQueueForHeartbeat() {
    if (!task) return
    setQueueing(true); setDeployError(null)
    try {
      const res = await fetch('/api/openclaw/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'queue_task', taskTitle: task.title, taskPayload: { taskId: task.id }, runMode: 'next_heartbeat' }),
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'details',  label: 'Details',  icon: <ListTodo size={13} /> },
    { id: 'comments', label: 'Comments', icon: <MessageSquare size={13} /> },
    { id: 'history',  label: 'History',  icon: <History size={13} /> },
  ]

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={onClose}
          />
          <motion.aside
            key="drawer"
            className={cn('fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col', 'border-l border-[var(--border)]')}
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-lifted)' }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
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
                      <ExternalLink size={9} /> Deployed
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold leading-snug" style={{ color: 'var(--text)' }}>{task.title}</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg transition-colors flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Due date editor */}
            <div className="px-6 py-3 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
              <Clock size={13} style={{ color: 'var(--text-quiet)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Due</span>
              <input
                type="date"
                className="text-xs rounded-md px-2 py-1 flex-1 max-w-[160px]"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                value={task.dueAt ? task.dueAt.split('T')[0] : ''}
                onChange={(e) => updateTask.mutate({ id: task.id, dueAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              />
              {task.dueAt && (
                <button
                  className="text-[10px]"
                  style={{ color: 'var(--text-quiet)' }}
                  onClick={() => updateTask.mutate({ id: task.id, dueAt: '' })}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex px-6 gap-1 flex-shrink-0 pt-3" style={{ borderBottom: '1px solid var(--border)' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors',
                    activeTab === tab.id
                      ? 'border-b-2 border-[var(--accent-blue)]'
                      : 'opacity-60 hover:opacity-80',
                  )}
                  style={{ color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-muted)' }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {activeTab === 'details' && (
                <div className="space-y-5">
                  <DeployBanner task={task} />

                  {task.description ? (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-quiet)' }}>Description</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{task.description}</p>
                    </div>
                  ) : (
                    <p className="text-sm italic" style={{ color: 'var(--text-quiet)' }}>No description provided.</p>
                  )}

                  <div className="space-y-4 pt-1">
                    <DetailRow icon={<Flame size={14} />} label="Momentum Score">
                      <span className={cn('font-semibold',
                        task.momentumScore >= 70 ? 'text-amber-600 dark:text-amber-400' :
                        task.momentumScore >= 40 ? 'text-blue-700 dark:text-blue-400' : ''
                      )} style={task.momentumScore < 40 ? { color: 'var(--text-muted)' } : {}}>
                        {task.momentumScore > 0 ? Math.round(task.momentumScore) : '—'}
                      </span>
                    </DetailRow>

                    <DetailRow icon={<Bot size={14} />} label="Assigned Agent">
                      {task.assignedAgentId
                        ? <span className="font-mono text-sm text-primary">{task.assignedAgentId}</span>
                        : <span style={{ color: 'var(--text-quiet)' }}>Unassigned</span>}
                    </DetailRow>

                    <DetailRow icon={<CalendarDays size={14} />} label="Created">
                      <span title={formatDateTime(task.createdAt)}>{formatRelativeTime(task.createdAt)}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>({formatDateTime(task.createdAt)})</span>
                    </DetailRow>

                    <DetailRow icon={<Clock size={14} />} label="Last Updated">
                      <span title={formatDateTime(task.updatedAt)}>{formatRelativeTime(task.updatedAt)}</span>
                    </DetailRow>

                    {task.completedAt && (
                      <DetailRow icon={<CheckCircle2 size={14} />} label="Completed">
                        <span title={formatDateTime(task.completedAt)}>{formatRelativeTime(task.completedAt)}</span>
                      </DetailRow>
                    )}

                    {task.tags.length > 0 && (
                      <DetailRow icon={<Tag size={14} />} label="Tags">
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {task.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </DetailRow>
                    )}
                  </div>

                  {deployError && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertCircle size={13} className="text-destructive flex-shrink-0" />
                      <p className="text-xs text-destructive">{deployError}</p>
                    </motion.div>
                  )}

                  {deploySuccess && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 size={13} className="text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">Successfully deployed to OpenClaw</p>
                    </motion.div>
                  )}
                </div>
              )}

              {activeTab === 'comments' && <CommentsTab taskId={task.id} />}
              {activeTab === 'history' && <HistoryTab taskId={task.id} />}
            </div>

            {/* Footer — only show deploy actions on details tab */}
            {activeTab === 'details' && (
              <div className="flex-shrink-0 px-6 py-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                <GlowButton variant="primary" size="sm" className="w-full" icon={<Send size={13} />}
                  loading={deploying} disabled={deploying || queueing || deploySuccess} onClick={handleDeploy}>
                  {deploySuccess ? 'Deployed!' : 'Deploy to OpenClaw'}
                </GlowButton>
                <GlowButton variant="secondary" size="sm" className="w-full" icon={<ListTodo size={13} />}
                  loading={queueing} disabled={deploying || queueing} onClick={handleQueueForHeartbeat}>
                  Queue for Heartbeat
                </GlowButton>
                <GlowButton variant="ghost" size="sm" className="w-full" onClick={onClose}>Close</GlowButton>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
