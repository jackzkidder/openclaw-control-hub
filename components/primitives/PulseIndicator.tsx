import { cn } from '@/lib/utils/cn'

type PulseColor = 'green' | 'cyan' | 'amber' | 'red' | 'violet' | 'gray'

interface PulseIndicatorProps {
  color?: PulseColor
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  className?: string
}

const colorMap: Record<PulseColor, { dot: string; ring: string }> = {
  green:  { dot: 'bg-status-online',  ring: 'bg-status-online/30' },
  cyan:   { dot: 'bg-primary',        ring: 'bg-primary/30' },
  amber:  { dot: 'bg-status-warning', ring: 'bg-status-warning/30' },
  red:    { dot: 'bg-status-error',   ring: 'bg-status-error/30' },
  violet: { dot: 'bg-status-idle',    ring: 'bg-status-idle/30' },
  gray:   { dot: 'bg-status-offline', ring: 'bg-status-offline/30' },
}

const sizeMap = {
  sm: { dot: 'w-1.5 h-1.5', ring: 'w-3 h-3' },
  md: { dot: 'w-2.5 h-2.5', ring: 'w-5 h-5' },
  lg: { dot: 'w-3.5 h-3.5', ring: 'w-7 h-7' },
}

export function PulseIndicator({
  color = 'green',
  size = 'md',
  pulse = true,
  className,
}: PulseIndicatorProps) {
  const { dot, ring } = colorMap[color]
  const { dot: dotSize, ring: ringSize } = sizeMap[size]

  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      {pulse && (
        <span
          className={cn(
            'absolute rounded-full animate-ping opacity-75',
            ring,
            ringSize
          )}
        />
      )}
      <span className={cn('relative rounded-full', dot, dotSize)} />
    </span>
  )
}
