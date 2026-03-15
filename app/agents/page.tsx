'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Cpu, Activity, Clock, Zap, AlertCircle } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { BlurModal } from '@/components/primitives/BlurModal'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { AgentRoster } from '@/components/agents/AgentRoster'
import { useAgents } from '@/store/useAppStore'
import type { Agent } from '@/lib/openclaw/types'
import { formatRelativeTime, formatCost, STATUS_COLORS } from '@/lib/utils/formatters'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function AgentsPage() {
  const agents = useAgents()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const runningCount = agents.filter((a) => a.status === 'running').length
  const offlineCount = agents.filter((a) => a.status === 'offline').length
  const errorCount   = agents.filter((a) => a.status === 'error').length

  const subtitle = `${agents.length} agent${agents.length !== 1 ? 's' : ''} — ${runningCount} running`

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar title="Agents" subtitle={subtitle} />

      {/* Summary strip */}
      <div className="px-6 py-3 border-b border-white/[0.07] flex items-center gap-6">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-2xl font-semibold text-foreground">{agents.length}</span>
          <span className="text-sm text-muted-foreground">total agents</span>
        </motion.div>
        <div className="h-4 w-px bg-white/[0.07]" />
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-status-online" />
          <span className="text-sm text-muted-foreground">{runningCount} running</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-sm text-muted-foreground">{offlineCount} offline</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-error" />
            <span className="text-sm text-muted-foreground">{errorCount} error</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AgentRoster onSelect={(agent) => setSelectedAgent(agent)} />
      </div>

      {/* Agent detail drawer */}
      <BlurModal
        open={selectedAgent !== null}
        onClose={() => setSelectedAgent(null)}
        title={selectedAgent?.name ?? 'Agent Details'}
        size="lg"
      >
        {selectedAgent && (
          <motion.div
            className="space-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-panel bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {selectedAgent.name}
                </h3>
                <p className="text-sm text-muted-foreground font-mono truncate">
                  {selectedAgent.id}
                </p>
              </div>
              <span className={`text-sm font-medium capitalize ${STATUS_COLORS[selectedAgent.status] ?? 'text-muted-foreground'}`}>
                {selectedAgent.status}
              </span>
            </motion.div>

            {/* Stats grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: <Cpu className="w-4 h-4" />,
                  label: 'Model',
                  value: selectedAgent.model ?? 'Unknown',
                },
                {
                  icon: <Activity className="w-4 h-4" />,
                  label: 'Status',
                  value: selectedAgent.status,
                },
                {
                  icon: <Clock className="w-4 h-4" />,
                  label: 'Last Active',
                  value: formatRelativeTime(selectedAgent.lastActiveAt),
                },
                {
                  icon: <Zap className="w-4 h-4" />,
                  label: 'Total Cost',
                  value: formatCost(selectedAgent.tokensUsed.totalCost),
                },
              ].map((stat) => (
                <GlassPanel key={stat.label} className="p-4 flex items-start gap-3">
                  <span className="text-muted-foreground mt-0.5">{stat.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{stat.value}</p>
                  </div>
                </GlassPanel>
              ))}
            </motion.div>

            {/* Capabilities */}
            {selectedAgent.capabilities && selectedAgent.capabilities.length > 0 && (
              <motion.div variants={itemVariants}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Capabilities
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary"
                    >
                      <Zap className="w-3 h-3" />
                      {cap}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Error info */}
            {selectedAgent.status === 'error' && (
              <motion.div variants={itemVariants}>
                <div className="flex items-start gap-2 p-3 rounded-card bg-status-error/10 border border-status-error/20">
                  <AlertCircle className="w-4 h-4 text-status-error mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-status-error">Agent is in an error state</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </BlurModal>
    </div>
  )
}
