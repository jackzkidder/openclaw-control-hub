'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Zap, TrendingUp, Calendar, AlertTriangle } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { AnimatedMetricCard } from '@/components/cards/AnimatedMetricCard'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { CostChart } from '@/components/charts/CostChart'
import { UsageBreakdown } from '@/components/charts/UsageBreakdown'
import { useSettings } from '@/hooks/useSettings'
import { formatCost, formatTokenCount } from '@/lib/utils/formatters'

interface UsageSummary {
  totalInputTokens: number
  totalOutputTokens: number
  totalCostUsd: number
  byAgent: Record<string, {
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheWriteTokens: number
    totalCost: number
  }>
  byModel: Record<string, unknown>
  dailyTrend: Array<{
    date: string
    agentId: string
    model: string
    inputTokens: number
    outputTokens: number
    costUsd: number
  }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] } },
}

const DAYS_OPTIONS = [7, 14, 30, 90] as const

export default function UsagePage() {
  const [days, setDays] = useState<(typeof DAYS_OPTIONS)[number]>(30)
  const { settings } = useSettings()
  const monthlyBudget = (settings?.monthlyBudget as number | undefined) ?? 100

  const { data, isLoading, error } = useQuery<UsageSummary>({
    queryKey: ['usage', days],
    queryFn: () => fetch(`/api/usage?days=${days}`).then((r) => r.json()),
    refetchInterval: 60_000,
  })

  const totalTokens = (data?.totalInputTokens ?? 0) + (data?.totalOutputTokens ?? 0)
  const totalCost = data?.totalCostUsd ?? 0

  // Avg daily cost over the period
  const avgDaily = days > 0 ? totalCost / days : 0

  // Projected monthly (30 days)
  const projectedMonthly = avgDaily * 30

  const overBudget = projectedMonthly > monthlyBudget

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar
        title="Usage & Cost"
        subtitle="Token usage and spending"
        actions={
          <div className="flex items-center gap-1 bg-surface-2 border border-white/[0.07] rounded-card p-1">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  days === d
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Budget warning */}
        {overBudget && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-panel bg-amber-500/10 border border-amber-500/30"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-300">Budget Warning</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                Projected monthly spend of{' '}
                <span className="font-semibold">{formatCost(projectedMonthly)}</span> exceeds
                your budget of{' '}
                <span className="font-semibold">{formatCost(monthlyBudget)}</span>.
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Metric cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            <AnimatedMetricCard
              title="Total Tokens"
              value={isLoading ? '...' : formatTokenCount(totalTokens)}
              subtitle={`last ${days} days`}
              icon={Zap}
              accent="cyan"
              loading={isLoading}
            />
            <AnimatedMetricCard
              title="Total Cost"
              value={isLoading ? '...' : formatCost(totalCost)}
              subtitle={`last ${days} days`}
              icon={DollarSign}
              accent="violet"
              loading={isLoading}
            />
            <AnimatedMetricCard
              title="Avg Daily Cost"
              value={isLoading ? '...' : formatCost(avgDaily)}
              subtitle="per day average"
              icon={Calendar}
              accent="cyan"
              loading={isLoading}
            />
            <AnimatedMetricCard
              title="Projected Monthly"
              value={isLoading ? '...' : formatCost(projectedMonthly)}
              subtitle={overBudget ? 'over budget' : `of ${formatCost(monthlyBudget)} budget`}
              icon={TrendingUp}
              accent={overBudget ? 'amber' : 'violet'}
              loading={isLoading}
            />
          </motion.div>

          {/* Charts */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CostChart
              data={data?.dailyTrend ?? []}
              title="Cost Over Time"
            />
            <UsageBreakdown
              data={Object.entries(data?.byAgent ?? {}).map(([name, u]) => ({
                name,
                input: u.inputTokens,
                output: u.outputTokens,
              }))}
              title="Usage Breakdown"
            />
          </motion.div>

          {/* Error state */}
          {error && (
            <motion.div variants={itemVariants}>
              <GlassPanel className="p-6 text-center">
                <p className="text-sm text-status-error">
                  Failed to load usage data. Please try again.
                </p>
              </GlassPanel>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
