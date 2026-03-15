'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { GlassPanel } from '@/components/primitives/GlassPanel'

interface CostChartProps {
  data: Array<{ date: string; costUsd: number; inputTokens?: number; outputTokens?: number }>
  title?: string
  height?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-white/10 rounded-lg p-3 shadow-modal text-xs">
      <p className="text-muted-foreground mb-2">
        {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
      </p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} className="text-foreground">
          <span className="text-muted-foreground">{p.name}: </span>
          {p.name === 'Cost' ? `$${p.value.toFixed(4)}` : p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export function CostChart({ data, title = 'Daily Cost', height = 200 }: CostChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    cost: d.costUsd,
  }))

  return (
    <GlassPanel noPadding className="p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => {
              try { return format(parseISO(v), 'MMM d') } catch { return v }
            }}
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${v.toFixed(2)}`}
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="cost"
            name="Cost"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#costGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassPanel>
  )
}
