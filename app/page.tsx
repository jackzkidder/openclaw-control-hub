'use client'

import { Activity, Bot, ListTodo, Heart } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { AnimatedMetricCard } from '@/components/cards/AnimatedMetricCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { useAgents, useHeartbeat } from '@/store/useAppStore'
import { useTasks } from '@/hooks/useTasks'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

function InfoPanel({ title, rows }: { title: string; rows: { label: string; value: string | number; ok?: boolean }[] }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-widest mb-4"
        style={{ color: 'var(--text-quiet)' }}
      >
        {title}
      </p>
      <div className="space-y-0">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-2.5"
            style={i < rows.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}}
          >
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: row.ok === false ? 'var(--danger)' : row.ok === true ? 'var(--success)' : 'var(--text)' }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { status, isConnected } = useConnectionStatus()
  const agents    = useAgents()
  const heartbeat = useHeartbeat()
  const { data: tasks = [] } = useTasks()

  const activeAgents = agents.filter((a) => a.status === 'running').length
  const runningTasks = tasks.filter((t) => t.status === 'in_progress').length
  const errorTasks   = tasks.filter((t) => t.status === 'cancelled').length
  const totalAgents  = agents.length

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: 'var(--bg)' }}>
      <TopBar title="Dashboard" subtitle="System overview" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto p-8 space-y-8">

          {/* Page heading */}
          <div className="pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Overview</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Monitor your agents, tasks, and system health in real time.
            </p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <AnimatedMetricCard
              title="Online Agents"
              value={activeAgents}
              subtitle={`${totalAgents} total registered`}
              icon={Bot}
              borderAccent="#3B82F6"
            />
            <AnimatedMetricCard
              title="Tasks In Progress"
              value={runningTasks}
              subtitle={`${tasks.length} total tasks`}
              icon={Activity}
              borderAccent="#8B5CF6"
            />
            <AnimatedMetricCard
              title="Queued Tasks"
              value={heartbeat?.queuedTasks ?? 0}
              subtitle="via heartbeat"
              icon={ListTodo}
              borderAccent="#F59E0B"
            />
            <AnimatedMetricCard
              title="Last Heartbeat"
              value={heartbeat ? formatRelativeTime(heartbeat.lastAt) : '—'}
              subtitle={heartbeat ? `${heartbeat.activeAgents} agents active` : 'Waiting…'}
              icon={Heart}
              borderAccent="#10B981"
            />
          </div>

          {/* Info panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <InfoPanel
              title="Workload"
              rows={[
                { label: 'Backlog',     value: tasks.filter(t => t.status === 'backlog').length },
                { label: 'In Progress', value: runningTasks },
                { label: 'In Review',   value: tasks.filter(t => t.status === 'review').length },
                { label: 'Done',        value: tasks.filter(t => t.status === 'done').length },
              ]}
            />
            <InfoPanel
              title="Throughput"
              rows={[
                { label: 'Total Tasks',   value: tasks.length },
                { label: 'Errors',        value: errorTasks },
                { label: 'Error Rate',    value: tasks.length > 0 ? `${Math.round((errorTasks / tasks.length) * 100)}%` : '0%' },
                { label: 'Active Agents', value: activeAgents },
              ]}
            />
            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'var(--text-quiet)' }}
              >
                Gateway Health
              </p>
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: isConnected ? 'var(--success)' : 'var(--danger)' }}
                />
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {isConnected ? 'Gateway connected' : 'Gateway offline'}
                </span>
              </div>
              <div className="space-y-0" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                {[
                  { label: 'Gateway',        value: status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Offline', ok: status === 'connected' },
                  { label: 'WebSocket',      value: isConnected ? 'Authenticated' : 'Not connected', ok: isConnected },
                  { label: 'Active Agents',  value: `${activeAgents} / ${totalAgents}`, ok: activeAgents > 0 || totalAgents === 0 },
                  { label: 'Task Queue',     value: `${runningTasks} running`, ok: errorTasks === 0 },
                ].map((item, i, arr) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2.5"
                    style={i < arr.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}}
                  >
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span
                      className="text-sm font-medium tabular-nums"
                      style={{ color: item.ok ? 'var(--success)' : 'var(--danger)' }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity />

        </div>
      </div>
    </div>
  )
}
