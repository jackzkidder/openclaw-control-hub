'use client'

import { useState } from 'react'
import { Bot, Cpu, Activity, Clock, Zap, AlertCircle } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { BlurModal } from '@/components/primitives/BlurModal'
import { AgentRoster } from '@/components/agents/AgentRoster'
import { useAgents } from '@/store/useAppStore'
import type { Agent } from '@/lib/openclaw/types'
import { formatRelativeTime, formatCost, STATUS_COLORS } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

export default function AgentsPage() {
  const agents = useAgents()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const runningCount = agents.filter((a) => a.status === 'running').length
  const offlineCount = agents.filter((a) => a.status === 'offline').length
  const errorCount   = agents.filter((a) => a.status === 'error').length

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: 'var(--bg)' }}>
      <TopBar title="Agents" subtitle={`${agents.length} agent${agents.length !== 1 ? 's' : ''} registered`} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto p-8">

          <div className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight" style={{ color: 'var(--text)' }}>Agents</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Live agent roster — updates in real time via WebSocket.
            </p>

            <div className="flex items-center gap-6 mt-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{agents.length}</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>total</span>
              </div>
              <div className="w-px h-5" style={{ background: 'var(--border)' }} />
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{runningCount} running</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-quiet)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{offlineCount} offline</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{errorCount} error</span>
                </div>
              )}
            </div>
          </div>

          <AgentRoster onSelect={(agent) => setSelectedAgent(agent)} />
        </div>
      </div>

      {/* Agent detail modal */}
      <BlurModal
        open={selectedAgent !== null}
        onClose={() => setSelectedAgent(null)}
        title={selectedAgent?.name ?? 'Agent Details'}
        size="lg"
      >
        {selectedAgent && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
              >
                <Bot className="w-6 h-6" style={{ color: 'var(--info)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {selectedAgent.name}
                </h3>
                <p className="text-sm font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                  {selectedAgent.id}
                </p>
              </div>
              <span className={cn('text-sm font-medium capitalize', STATUS_COLORS[selectedAgent.status] ?? '')}>
                {selectedAgent.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Cpu className="w-4 h-4" />, label: 'Model',       value: selectedAgent.model ?? 'Unknown' },
                { icon: <Activity className="w-4 h-4" />, label: 'Status',  value: selectedAgent.status },
                { icon: <Clock className="w-4 h-4" />, label: 'Last Active',value: formatRelativeTime(selectedAgent.lastActiveAt) },
                { icon: <Zap className="w-4 h-4" />, label: 'Total Cost',   value: formatCost(selectedAgent.tokensUsed.totalCost) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                >
                  <span style={{ color: 'var(--text-quiet)' }} className="mt-0.5">{stat.icon}</span>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-quiet)' }}>{stat.label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text)' }}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedAgent.capabilities && selectedAgent.capabilities.length > 0 && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-quiet)' }}
                >
                  Capabilities
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: 'rgba(37, 99, 235, 0.08)',
                        border: '1px solid rgba(37, 99, 235, 0.15)',
                        color: 'var(--info)',
                      }}
                    >
                      <Zap className="w-3 h-3" />
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedAgent.status === 'error' && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{
                  background: 'rgba(220, 38, 38, 0.05)',
                  border: '1px solid rgba(220, 38, 38, 0.15)',
                }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--danger)' }} />
                <p className="text-sm" style={{ color: 'var(--danger)' }}>Agent is in an error state</p>
              </div>
            )}
          </div>
        )}
      </BlurModal>
    </div>
  )
}
