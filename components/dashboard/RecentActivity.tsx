'use client'

import { motion } from 'framer-motion'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { FeedItem } from '@/components/cards/FeedItem'
import { useRecentEvents } from '@/store/useAppStore'
import { Activity } from 'lucide-react'

export function RecentActivity() {
  const events = useRecentEvents()

  return (
    <GlassPanel noPadding className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Live Activity</p>
        </div>
        <span className="text-xs text-muted-foreground">{events.length} events</span>
      </div>
      <div className="overflow-y-auto max-h-80 px-5">
        {events.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Waiting for events...</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Connect to your OpenClaw Gateway to see live activity</p>
          </div>
        ) : (
          events.slice(0, 30).map((event, i) => (
            <FeedItem key={event.id} event={event} delay={i * 0.02} />
          ))
        )}
      </div>
    </GlassPanel>
  )
}
