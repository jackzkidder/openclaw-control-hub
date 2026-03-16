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
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150"
      style={active ? {
        background: 'var(--accent)',
        color: 'var(--surface)',
      } : {
        background: 'var(--surface-muted)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      {label}
      {count !== undefined && (
        <span className="text-[10px] tabular-nums" style={{ opacity: 0.7 }}>
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
      <div
        className="flex flex-col items-center justify-center text-center p-8 rounded-xl"
        style={{
          minHeight: '240px',
          border: '2px dashed var(--border)',
          background: 'var(--surface-muted)',
        }}
      >
        <Bot size={32} style={{ color: 'var(--text-quiet)' }} />
        {filtered ? (
          <>
            <p className="text-base font-semibold mt-3" style={{ color: 'var(--text)' }}>No agents match your filters</p>
            <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--text-muted)' }}>Try adjusting the status filter or search query</p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold mt-3" style={{ color: 'var(--text)' }}>No agents connected</p>
            <p className="text-sm mt-1 max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Connect to your OpenClaw Gateway to see live agent data.
            </p>
          </>
        )}
      </div>
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
    const c: Record<StatusFilter, number> = { all: storeAgents.length, running: 0, idle: 0, error: 0, paused: 0, offline: 0 }
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
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-quiet)' }}
          />
          <input
            type="text"
            placeholder="Search agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
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
          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
          style={{ color: 'var(--text-muted)' }}
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
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
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
