'use client'

import { motion } from 'framer-motion'
import { Activity, Bot, DollarSign, Heart } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { AnimatedMetricCard } from '@/components/cards/AnimatedMetricCard'
import { StatusRing } from '@/components/primitives/StatusRing'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { PulseIndicator } from '@/components/primitives/PulseIndicator'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { useAppStore, useAgents, useHeartbeat } from '@/store/useAppStore'
import { useTasks } from '@/hooks/useTasks'
import { formatCost, formatRelativeTime } from '@/lib/utils/formatters'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function DashboardPage() {
  const { status, isConnected } = useConnectionStatus()
  const agents = useAgents()                    // Object.values(s.agents) → Agent[]
  const heartbeat = useHeartbeat()
  const { data: tasks = [] } = useTasks()       // TanStack Query → Task[]

  const activeAgents  = agents.filter((a) => a.status === 'running').length
  const runningTasks  = tasks.filter((t) => t.status === 'in_progress').length
  const errorTasks    = tasks.filter((t) => t.status === 'cancelled').length
  const totalAgents   = agents.length

  const healthPct =
    totalAgents === 0
      ? isConnected ? 80 : 0
      : Math.round(
          (activeAgents / Math.max(1, totalAgents)) * 60 +
          ((tasks.length - errorTasks) / Math.max(1, tasks.length)) * 40
        )

  const systemItems = [
    { label: 'Gateway',       value: status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Offline', ok: status === 'connected' },
    { label: 'WebSocket',     value: isConnected ? 'Authenticated' : 'Not connected', ok: isConnected },
    { label: 'Active Agents', value: `${activeAgents} / ${totalAgents}`, ok: activeAgents > 0 || totalAgents === 0 },
    { label: 'Task Queue',    value: `${runningTasks} running`, ok: errorTasks === 0 },
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar title="Dashboard" subtitle="System overview" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Metric cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <AnimatedMetricCard
              title="Active Agents"
              value={activeAgents}
              subtitle={`${totalAgents} total`}
              icon={Bot}
              accent="cyan"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <AnimatedMetricCard
              title="Tasks Running"
              value={runningTasks}
              subtitle={`${tasks.length} total`}
              icon={Activity}
              accent="violet"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <AnimatedMetricCard
              title="Queued Tasks"
              value={heartbeat?.queuedTasks ?? 0}
              subtitle="via heartbeat"
              icon={DollarSign}
              accent="cyan"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <AnimatedMetricCard
              title="Last Heartbeat"
              value={heartbeat ? formatRelativeTime(heartbeat.lastAt) : 'None'}
              subtitle={heartbeat ? `${heartbeat.activeAgents} agents active` : 'Waiting…'}
              icon={Heart}
              accent="violet"
            />
          </motion.div>
        </motion.div>

        {/* Hero row: StatusRing + system info */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <GlassPanel className="flex flex-col items-center justify-center gap-4 p-8 h-full min-h-[260px]">
              <StatusRing
                value={healthPct}
                size={160}
                strokeWidth={8}
                label={`${healthPct}%`}
                sublabel="health"
              />
              <p className="text-sm text-muted-foreground">Overall System Health</p>
            </GlassPanel>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-2">
            <GlassPanel className="p-6 h-full min-h-[260px] flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <PulseIndicator color={isConnected ? 'green' : 'gray'} pulse={isConnected} />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  System Status
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {systemItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-card bg-surface-2/60 border border-white/[0.07] px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`text-sm font-medium ${item.ok ? 'text-status-online' : 'text-status-error'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>

        {/* Recent activity */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <RecentActivity />
        </motion.div>
      </div>
    </div>
  )
}
