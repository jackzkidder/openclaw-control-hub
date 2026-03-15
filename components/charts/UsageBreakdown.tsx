'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { GlassPanel } from '@/components/primitives/GlassPanel'

interface UsageBreakdownProps {
  data: Array<{ name: string; input: number; output: number }>
  title?: string
  height?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-white/10 rounded-lg p-3 shadow-modal text-xs">
      <p className="text-muted-foreground mb-2">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} className="text-foreground">
          <span className="text-muted-foreground">{p.name}: </span>
          {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export function UsageBreakdown({ data, title = 'Token Usage by Agent', height = 200 }: UsageBreakdownProps) {
  return (
    <GlassPanel noPadding className="p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 10, color: '#64748b' }}
          />
          <Bar dataKey="input" name="Input" stackId="a" fill="#22d3ee" fillOpacity={0.7} radius={[0, 0, 0, 0]} />
          <Bar dataKey="output" name="Output" stackId="a" fill="#a78bfa" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassPanel>
  )
}
