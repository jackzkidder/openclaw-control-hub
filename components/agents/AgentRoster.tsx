'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Bot, RefreshCw } from 'lucide-react'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { AgentCard } from '@/components/cards/AgentCard'
import { useAgents, useAppStore } from '@/store/useAppStore'
import type { Agent, AgentStatus } from '@/lib/openclaw/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | AgentStatus

interface AgentRosterProps {
  onSelect?: (agent: Agent) => void
}

// ─── Fetch agents from API ────────────────────────────────────────────────────

async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch('/api/agents')
  if (!res.ok) throw new Error('Failed to fetch agents')
  return res.json()
}

// ─── Filter button ────────────────────────────────────────────────────────────

interface FilterButtonProps {
  label: string
  active: boolean
  count?: number
  onClick: () => void
}

function FilterButton({ label, active, count, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
        active
          ? 'bg-primary text-surface shadow-glow'
          : 'bg-white/[0.04] text-muted-foreground border border-white/[0.08] hover:bg-white/[0.08] hover:text-foreground'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-[10px] tabular-nums ${active ? 'text-surface/70' : 'text-muted-foreground/60'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="col-span-full"
    >
      <GlassPanel className="flex flex-col items-center justify-center py-14 text-center" variant="subtle">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
          <Bot size={20} className="text-muted-foreground/50" />
        </div>
        {filtered ? (
          <>
            <p className="text-sm font-medium text-foreground mb-1">No agents match your filters</p>
            <p className="text-xs text-muted-foreground/60">Try adjusting the status filter or search query</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground mb-1">No agents connected</p>
            <p className="text-xs text-muted-foreground/60 max-w-xs leading-relaxed">
              Connect to your OpenClaw Gateway to see live agent data. Agents will appear here automatically.
            </p>
          </>
        )}
      </GlassPanel>
    </motion.div>
  )
}

// ─── AgentRoster ─────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'idle',    label: 'Idle' },
  { value: 'error',   label: 'Error' },
]

export function AgentRoster({ onSelect }: AgentRosterProps) {
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Agents from the global store (live via websocket)
  const storeAgents = useAgents()

  // Agents from REST API (for initial load / reconciliation)
  const { data: apiAgents = [], isFetching, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn:  fetchAgents,
    staleTime: 30_000,
  })

  // Upsert API agents into the store so both sources stay in sync
  const upsertAgent = useAppStore((s) => s.upsertAgent)
  useMemo(() => {
    for (const agent of apiAgents) {
      upsertAgent(agent)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiAgents])

  // Filtered + searched agents
  const filteredAgents = useMemo(() => {
    let agents = storeAgents

    // Status filter
    if (statusFilter !== 'all') {
      agents = agents.filter((a) => a.status === statusFilter)
    }

    // Search filter (name, model, description, id)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      agents = agents.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.model.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
      )
    }

    // Sort: running first, then idle, then others
    return [...agents].sort((a, b) => {
      const order: AgentStatus[] = ['running', 'idle', 'paused', 'error', 'offline']
      return order.indexOf(a.status) - order.indexOf(b.status)
    })
  }, [storeAgents, statusFilter, search])

  // Per-status counts for filter badges
  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: storeAgents.length, running: 0, idle: 0, error: 0 }
    for (const a of storeAgents) {
      if (a.status === 'running') c.running++
      if (a.status === 'idle')    c.idle++
      if (a.status === 'error')   c.error++
    }
    return c
  }, [storeAgents])

  const isFiltered = statusFilter !== 'all' || search.trim() !== ''

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={12} className="text-muted-foreground/50 flex-shrink-0" />
          {STATUS_FILTERS.map((f) => (
            <FilterButton
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              count={counts[f.value]}
              onClick={() => setStatusFilter(f.value)}
            />
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          title="Refresh agents"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Result count */}
      {isFiltered && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground"
        >
          Showing {filteredAgents.length} of {storeAgents.length} agent{storeAgents.length !== 1 ? 's' : ''}
        </motion.p>
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAgents.length === 0 ? (
            <EmptyState key="empty" filtered={isFiltered} />
          ) : (
            filteredAgents.map((agent, i) => (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
              >
                <AgentCard
                  agent={agent}
                  onClick={() => onSelect?.(agent)}
                  delay={0}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
