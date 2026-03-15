'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface StatusRingProps {
  value: number       // 0-100
  size?: number       // px
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  sublabel?: string
  animate?: boolean
  className?: string
}

export function StatusRing({
  value,
  size = 120,
  strokeWidth = 6,
  color = '#22d3ee',
  trackColor = 'rgba(255,255,255,0.06)',
  label,
  sublabel,
  animate = true,
  className,
}: StatusRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: animate ? offset : offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
      </svg>
      {/* Center content */}
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && (
            <span className="text-foreground font-bold" style={{ fontSize: size * 0.18 }}>
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-muted-foreground" style={{ fontSize: size * 0.1 }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
