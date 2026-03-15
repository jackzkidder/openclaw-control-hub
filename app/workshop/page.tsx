'use client'

import dynamic from 'next/dynamic'
import { TopBar } from '@/components/layout/TopBar'

// dnd-kit uses browser-only APIs — disable SSR to avoid undefined component errors
const KanbanBoard = dynamic(
  () => import('@/components/workshop/KanbanBoard').then((m) => ({ default: m.KanbanBoard })),
  { ssr: false, loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-sm text-muted-foreground animate-pulse">Loading board…</div>
    </div>
  )}
)

export default function WorkshopPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar title="Workshop" subtitle="Task orchestration &amp; planning" />
      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard />
      </div>
    </div>
  )
}
