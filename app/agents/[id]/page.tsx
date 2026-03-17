'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'
import { TopBar } from '@/components/layout/TopBar'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { ArrowLeft, Bot, Zap, Clock, Activity, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils/formatters'
import type { Task } from '@/lib/openclaw/types'

const STATUS_DOT: Record<string, string> = {
  running: '#3B82F6', idle: '#10B981', paused: '#F59E0B',
  error: '#EF4444', offline: '#9CA3AF',
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const agent = useAppStore((s) => s.agents[id])
  const recentEvents = useAppStore((s) => s.recentEvents.filter((e) => e.agentId === id))

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks')
      if (!res.ok) return []
      return res.json()
    },
  })

  const agentTasks = tasks.filter((t) => t.assignedAgentId === id)

  if (!agent) {
    return (
      <div className="flex-1 overflow-y-auto">
        <TopBar title="Agent Detail" />
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Bot size={32} style={{ color: 'var(--text-quiet)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Agent "{id}" not found or not yet seen.</p>
          <Link href="/agents" className="text-xs font-medium" style={{ color: 'var(--accent-blue)' }}>← Back to agents</Link>
        </div>
      </div>
    )
  }

  const totalTokens = (agent.tokensUsed?.inputTokens ?? 0) + (agent.tokensUsed?.outputTokens ?? 0)

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBar
        title={agent.name}
        subtitle={`Agent · ${agent.model}`}
        actions={
          <Link href="/agents" className="flex items-center gap-1.5 text-xs font-medium mr-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={13} /> Agents
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Status card */}
        <GlassPanel>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                <Bot size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{agent.name}</p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{agent.id}</p>
                {agent.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{agent.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[agent.status] ?? '#9CA3AF' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{agent.status}</span>
            </div>
          </div>

          {agent.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {agent.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Input Tokens', value: (agent.tokensUsed?.inputTokens ?? 0).toLocaleString(), icon: <Zap size={14} />, color: '#3B82F6' },
            { label: 'Output Tokens', value: (agent.tokensUsed?.outputTokens ?? 0).toLocaleString(), icon: <Zap size={14} />, color: '#8B5CF6' },
            { label: 'Total Cost', value: `$${(agent.tokensUsed?.totalCost ?? 0).toFixed(4)}`, icon: <Activity size={14} />, color: '#F59E0B' },
            { label: 'Assigned Tasks', value: agentTasks.length.toString(), icon: <CheckSquare size={14} />, color: '#10B981' },
          ].map((stat) => (
            <GlassPanel key={stat.label} noPadding className="p-4" style={{ borderLeft: `4px solid ${stat.color}` }}>
              <div className="flex items-center gap-2 mb-1" style={{ color: stat.color }}>
                {stat.icon}
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-quiet)' }}>{stat.label}</span>
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{stat.value}</p>
            </GlassPanel>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned tasks */}
          <GlassPanel>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
              <CheckSquare size={14} className="inline mr-2" style={{ color: 'var(--accent-blue)' }} />
              Assigned Tasks
            </h3>
            {agentTasks.length === 0 ? (
              <div className="text-center py-8 rounded-lg" style={{ border: '2px dashed var(--border)', background: 'var(--surface-muted)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No tasks assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                    <span className="text-xs font-medium truncate flex-1 mr-2" style={{ color: 'var(--text)' }}>{task.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Recent events */}
          <GlassPanel>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
              <Clock size={14} className="inline mr-2" style={{ color: 'var(--accent-blue)' }} />
              Recent Activity
            </h3>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 rounded-lg" style={{ border: '2px dashed var(--border)', background: 'var(--surface-muted)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No recent events</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentEvents.slice(0, 20).map((event) => (
                  <div key={event.id} className="flex items-start gap-2.5 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--accent-blue)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium" style={{ color: 'var(--text)' }}>{event.type}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{event.summary}</p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-quiet)' }}>{formatRelativeTime(event.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>

        {/* Last active */}
        {agent.lastActiveAt && (
          <p className="text-xs" style={{ color: 'var(--text-quiet)' }}>
            Last active {formatRelativeTime(agent.lastActiveAt)}
          </p>
        )}
      </div>
    </div>
  )
}
