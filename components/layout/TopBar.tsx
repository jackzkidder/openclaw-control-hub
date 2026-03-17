'use client'

import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Search, Bell, X, FileText, CheckSquare } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { Task, AppNotification } from '@/lib/openclaw/types'

// ─── Search ───────────────────────────────────────────────────────────────────

function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (query.length < 2) return { tasks: [], documents: [] }
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) return { tasks: [], documents: [] }
      return res.json() as Promise<{ tasks: Task[]; documents: Array<{ id: string; name: string }> }>
    },
    enabled: query.length >= 2,
    staleTime: 1000,
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const hasResults = (data?.tasks.length ?? 0) + (data?.documents.length ?? 0) > 0

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
        <Search size={13} style={{ color: 'var(--text-quiet)' }} />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search tasks, documents…"
          className="bg-transparent text-xs outline-none w-44"
          style={{ color: 'var(--text)' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false) }}>
            <X size={11} style={{ color: 'var(--text-quiet)' }} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl z-50 overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lifted)' }}
          >
            {isFetching && (
              <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>Searching…</div>
            )}
            {!isFetching && !hasResults && query.length >= 2 && (
              <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>No results for "{query}"</div>
            )}
            {!isFetching && (data?.tasks ?? []).length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-quiet)' }}>Tasks</p>
                {data!.tasks.map((task) => (
                  <a key={task.id} href="/workshop" onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-[var(--surface-muted)]">
                    <CheckSquare size={13} style={{ color: 'var(--accent-blue)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{task.title}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{task.status} · {task.priority}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
            {!isFetching && (data?.documents ?? []).length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-quiet)' }}>Documents</p>
                {data!.documents.map((doc) => (
                  <a key={doc.id} href="/docu-digest" onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-[var(--surface-muted)]">
                    <FileText size={13} style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs truncate" style={{ color: 'var(--text)' }}>{doc.name}</p>
                  </a>
                ))}
              </div>
            )}
            <div className="h-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Notifications Panel ──────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) return []
      return res.json()
    },
    refetchInterval: 15_000,
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAll = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readAll: true }),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const typeColor: Record<string, string> = {
    alert: 'var(--danger)', warning: 'var(--warning)', error: 'var(--danger)', info: 'var(--accent-blue)',
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
        }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: 'var(--danger)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl z-50 overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lifted)' }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notifications</p>
              {unreadCount > 0 && (
                <button onClick={() => markAll.mutate()} className="text-[11px] font-medium" style={{ color: 'var(--accent-blue)' }}>
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Bell size={24} className="mb-2" style={{ color: 'var(--text-quiet)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--surface-muted)]"
                    style={{ borderBottom: '1px solid var(--border)', opacity: n.read ? 0.6 : 1 }}
                    onClick={() => !n.read && markOne.mutate(n.id)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.read ? 'var(--border)' : typeColor[n.type] ?? 'var(--accent-blue)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{n.title}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-quiet)' }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function TopBar({ title, subtitle, actions, className }: TopBarProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header
      className={cn('flex items-center justify-between h-14 px-6 flex-shrink-0', className)}
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div>
        <h1 className="text-lg font-semibold leading-tight" style={{ color: 'var(--text)' }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <SearchBar />
        <NotificationBell />

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-muted)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>U</span>
        </div>
      </div>
    </header>
  )
}
