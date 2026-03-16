'use client'

import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface AnimatedMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: { value: number; label: string }
  accent?: 'cyan' | 'violet' | 'green' | 'amber' | 'rose'
  borderAccent?: string
  loading?: boolean
  className?: string
  delay?: number
}

export function AnimatedMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading = false,
  trend,
  borderAccent,
  className,
}: AnimatedMetricCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl p-6 cursor-default transition-all duration-150',
        'hover:-translate-y-0.5',
        className
      )}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        borderLeft: borderAccent ? `4px solid ${borderAccent}` : '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lifted)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-quiet)' }}
        >
          {title}
        </p>
        {Icon && (
          <Icon size={20} style={{ color: 'var(--text-quiet)' }} />
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div
            className="h-10 w-28 rounded-lg animate-pulse"
            style={{ background: 'var(--surface-muted)' }}
          />
          <div
            className="h-3 w-20 rounded animate-pulse"
            style={{ background: 'var(--surface-muted)' }}
          />
        </div>
      ) : (
        <>
          <div
            className="text-[40px] font-semibold leading-none tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            {value}
          </div>
          {subtitle && (
            <p className="text-[13px] mt-2" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </>
      )}

      {trend && !loading && (
        <div
          className="flex items-center gap-1 text-xs font-medium mt-3"
          style={{ color: trend.value >= 0 ? 'var(--success)' : 'var(--danger)' }}
        >
          <span>{trend.value >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </div>
  )
}
