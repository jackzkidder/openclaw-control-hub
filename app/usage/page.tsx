'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Zap, TrendingUp, Calendar, AlertTriangle } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { AnimatedMetricCard } from '@/components/cards/AnimatedMetricCard'
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

  const totalTokens       = (data?.totalInputTokens ?? 0) + (data?.totalOutputTokens ?? 0)
  const totalCost         = data?.totalCostUsd ?? 0
  const avgDaily          = days > 0 ? totalCost / days : 0
  const projectedMonthly  = avgDaily * 30
  const overBudget        = projectedMonthly > monthlyBudget

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: 'var(--bg)' }}>
      <TopBar
        title="Usage & Cost"
        subtitle="Token usage and spending"
        actions={
          <div
            className="flex items-center gap-1 rounded-lg p-1"
            style={{ background: 'var(--surface-muted)' }}
          >
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className="px-3 py-1 text-xs rounded-md font-medium transition-all duration-150"
                style={days === d ? {
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  boxShadow: 'var(--shadow-card)',
                } : {
                  color: 'var(--text-muted)',
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto p-8 space-y-8">

          <div className="pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight" style={{ color: 'var(--text)' }}>Usage & Cost</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Token consumption and spending over the last {days} days.
            </p>
          </div>

          {/* Budget warning */}
          {overBudget && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.2)' }}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warning)' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>Budget Warning</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--warning)' }}>
                  Projected monthly spend of{' '}
                  <span className="font-semibold">{formatCost(projectedMonthly)}</span> exceeds your budget of{' '}
                  <span className="font-semibold">{formatCost(monthlyBudget)}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <AnimatedMetricCard
              title="Total Tokens"
              value={isLoading ? '…' : formatTokenCount(totalTokens)}
              subtitle={`last ${days} days`}
              icon={Zap}
              accent="cyan"
              loading={isLoading}
            />
            <AnimatedMetricCard
              title="Total Cost"
              value={isLoading ? '…' : formatCost(totalCost)}
              subtitle={`last ${days} days`}
              icon={DollarSign}
              accent="violet"
              loading={isLoading}
            />
            <AnimatedMetricCard
              title="Avg Daily Cost"
              value={isLoading ? '…' : formatCost(avgDaily)}
              subtitle="per day average"
              icon={Calendar}
              accent="green"
              loading={isLoading}
            />
            <AnimatedMetricCard
              title="Projected Monthly"
              value={isLoading ? '…' : formatCost(projectedMonthly)}
              subtitle={overBudget ? 'over budget' : `of ${formatCost(monthlyBudget)} budget`}
              icon={TrendingUp}
              accent={overBudget ? 'amber' : 'cyan'}
              loading={isLoading}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
          </div>

          {/* Error state */}
          {error && (
            <div
              className="rounded-xl p-6 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--danger)' }}>Failed to load usage data. Please try again.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
