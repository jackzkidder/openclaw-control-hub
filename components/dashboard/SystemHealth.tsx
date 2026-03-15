'use client'

import { motion } from 'framer-motion'
import { Server, Zap, Bot, ListTodo } from 'lucide-react'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { PulseIndicator } from '@/components/primitives/PulseIndicator'
import { useHeartbeat, useAppStore } from '@/store/useAppStore'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  status?: 'ok' | 'warn' | 'error' | 'neutral'
  pulse?: boolean
  delay?: number
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusToPulseColor(
  status: HealthCardProps['status']
): 'green' | 'amber' | 'red' | 'gray' {
  switch (status) {
    case 'ok':      return 'green'
    case 'warn':    return 'amber'
    case 'error':   return 'red'
    default:        return 'gray'
  }
}

const statusBorderMap: Record<NonNullable<HealthCardProps['status']>, string> = {
  ok:      'border-status-online/20',
  warn:    'border-status-warning/20',
  error:   'border-status-error/20',
  neutral: 'border-white/[0.07]',
}

const statusValueMap: Record<NonNullable<HealthCardProps['status']>, string> = {
  ok:      'text-status-online',
  warn:    'text-status-warning',
  error:   'text-status-error',
  neutral: 'text-foreground',
}

// ─── HealthCard ───────────────────────────────────────────────────────────────

function HealthCard({
  icon,
  label,
  value,
  subtext,
  status = 'neutral',
  pulse = false,
  delay = 0,
}: HealthCardProps) {
  const borderClass = statusBorderMap[status]
  const valueClass  = statusValueMap[status]
  const pulseColor  = statusToPulseColor(status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <GlassPanel
        className={`relative overflow-hidden border ${borderClass} hover:border-white/[0.14] transition-all`}
      >
        {/* Subtle background glow for active/ok cards */}
        {status === 'ok' && (
          <div className="absolute inset-0 bg-status-online/[0.03] rounded-panel pointer-events-none" />
        )}

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-1.5">{label}</p>
              <p className={`text-lg font-semibold leading-none ${valueClass}`}>
                {value}
              </p>
            </div>
          </div>
          <PulseIndicator
            color={pulseColor}
            size="sm"
            pulse={pulse && status === 'ok'}
          />
        </div>

        {subtext && (
          <p className="text-[11px] text-muted-foreground/60 mt-2.5 leading-snug">{subtext}</p>
        )}
      </GlassPanel>
    </motion.div>
  )
}

// ─── SystemHealth ─────────────────────────────────────────────────────────────

export function SystemHealth() {
  const { status, webhookReachable, latencyMs, isConnected, isConnecting } = useConnectionStatus()
  const heartbeat = useHeartbeat()
  const webhookReachableStore = useAppStore((s) => s.webhookReachable)

  // Gateway connection card values
  const gatewayLabel = isConnected
    ? 'Connected'
    : isConnecting
    ? 'Connecting…'
    : status === 'error'
    ? 'Error'
    : 'Disconnected'

  const gatewayStatus: HealthCardProps['status'] = isConnected
    ? 'ok'
    : isConnecting
    ? 'warn'
    : status === 'error'
    ? 'error'
    : 'neutral'

  const gatewaySubtext = latencyMs !== null
    ? `Latency: ${latencyMs}ms`
    : isConnecting
    ? 'Establishing connection…'
    : 'Not connected to gateway'

  // Webhook reachability
  const webhookStatus: HealthCardProps['status'] =
    webhookReachableStore === true
      ? 'ok'
      : webhookReachableStore === false
      ? 'error'
      : 'neutral'

  const webhookLabel =
    webhookReachableStore === true
      ? 'Reachable'
      : webhookReachableStore === false
      ? 'Unreachable'
      : 'Unknown'

  // Heartbeat-derived values
  const activeAgents = heartbeat?.activeAgents ?? 0
  const queuedTasks  = heartbeat?.queuedTasks ?? 0

  const agentStatus: HealthCardProps['status'] =
    !heartbeat ? 'neutral' : activeAgents > 0 ? 'ok' : 'neutral'

  const taskStatus: HealthCardProps['status'] =
    !heartbeat ? 'neutral' : queuedTasks > 0 ? 'warn' : 'ok'

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2 px-0.5">
        <Server size={13} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">System Health</p>
        {heartbeat && (
          <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">
            {new Date(heartbeat.lastAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3">
        <HealthCard
          icon={<Server size={14} />}
          label="Gateway"
          value={gatewayLabel}
          subtext={gatewaySubtext}
          status={gatewayStatus}
          pulse
          delay={0}
        />

        <HealthCard
          icon={<Zap size={14} />}
          label="Webhook"
          value={webhookLabel}
          subtext={
            webhookReachableStore === true
              ? 'Incoming events enabled'
              : webhookReachableStore === false
              ? 'Check webhook base URL'
              : 'Awaiting check…'
          }
          status={webhookStatus}
          pulse
          delay={0.05}
        />

        <HealthCard
          icon={<Bot size={14} />}
          label="Active Agents"
          value={heartbeat ? activeAgents : '—'}
          subtext={
            heartbeat
              ? activeAgents === 1
                ? '1 agent running'
                : `${activeAgents} agents running`
              : 'No heartbeat received'
          }
          status={agentStatus}
          pulse={activeAgents > 0}
          delay={0.1}
        />

        <HealthCard
          icon={<ListTodo size={14} />}
          label="Queued Tasks"
          value={heartbeat ? queuedTasks : '—'}
          subtext={
            heartbeat
              ? queuedTasks === 0
                ? 'Queue is clear'
                : `${queuedTasks} task${queuedTasks !== 1 ? 's' : ''} pending`
              : 'No heartbeat received'
          }
          status={taskStatus}
          delay={0.15}
        />
      </div>
    </div>
  )
}
