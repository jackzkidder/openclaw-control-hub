'use client'

import { FeedItem } from '@/components/cards/FeedItem'
import { useRecentEvents } from '@/store/useAppStore'
import { Activity } from 'lucide-react'

export function RecentActivity() {
  const events = useRecentEvents()

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: 'var(--info)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Live Activity</p>
          {/* Pulsing live dot */}
          <span className="flex items-center gap-1 ml-1">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'var(--success)' }}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>Live</span>
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-quiet)' }}>{events.length} events</span>
      </div>

      <div className="overflow-y-auto max-h-80">
        {events.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center p-8 m-4 rounded-xl"
            style={{
              minHeight: '200px',
              border: '2px dashed var(--border)',
              background: 'var(--surface-muted)',
            }}
          >
            <Activity size={32} style={{ color: 'var(--text-quiet)' }} />
            <p className="text-[15px] font-semibold mt-3" style={{ color: 'var(--text)' }}>No activity yet</p>
            <p className="text-[13px] mt-1 max-w-xs" style={{ color: 'var(--text-muted)' }}>
              Connect to your OpenClaw Gateway to see live activity
            </p>
          </div>
        ) : (
          events.slice(0, 30).map((event, i) => (
            <div key={event.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <FeedItem event={event} delay={i * 0.02} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
