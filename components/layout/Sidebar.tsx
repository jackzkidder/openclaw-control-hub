'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Kanban, Bot, Clock, DollarSign,
  FileText, MessageSquare, Settings, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'

const navSections = [
  {
    label: 'Overview',
    items: [{ href: '/', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Work',
    items: [
      { href: '/workshop',   icon: Kanban,   label: 'Workshop' },
      { href: '/automation', icon: Clock,    label: 'Automation' },
    ],
  },
  {
    label: 'Agents',
    items: [{ href: '/agents', icon: Bot, label: 'Agents' }],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/usage',         icon: DollarSign,    label: 'Usage & Cost' },
      { href: '/docu-digest',   icon: FileText,      label: 'Docu Digest' },
      { href: '/conversations', icon: MessageSquare, label: 'Conversations' },
    ],
  },
]

const bottomNav = [{ href: '/settings', icon: Settings, label: 'Settings' }]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { status } = useConnectionStatus()
  const isOnline = status === 'connected'

  function NavItem({ href, icon: Icon, label }: { href: string; icon: typeof Settings; label: string }) {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          'relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150',
          isActive ? 'font-semibold nav-active' : 'font-medium nav-inactive'
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full nav-accent-bar" />
        )}
        <Icon size={15} className={cn('flex-shrink-0', isActive ? 'nav-icon-active' : 'nav-icon-inactive')} />
        {label}
      </Link>
    )
  }

  return (
    <>
      {/* Brand */}
      <div className="flex items-center justify-between h-14 px-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0" style={{ color: 'var(--text)' }} aria-hidden="true">
            <path d="M10 2C10 2 9 6 9 10C9 12.5 9.5 14 10 15C10.5 14 11 12.5 11 10C11 6 10 2 10 2Z" fill="currentColor" opacity="0.9" />
            <path d="M10 2C10 2 6.5 5 5 8C3.8 10.5 4 12.5 4.5 13.5C5.5 12.5 6.5 11 7.5 8.5C8.5 6 10 2 10 2Z" fill="currentColor" opacity="0.7" />
            <path d="M10 2C10 2 13.5 5 15 8C16.2 10.5 16 12.5 15.5 13.5C14.5 12.5 13.5 11 12.5 8.5C11.5 6 10 2 10 2Z" fill="currentColor" opacity="0.7" />
            <ellipse cx="10" cy="16.5" rx="3" ry="1.5" fill="currentColor" opacity="0.4" />
          </svg>
          <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>OpenClaw Control</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden px-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-quiet)' }}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => <NavItem key={item.href} {...item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div className="px-3 py-2">
          {bottomNav.map((item) => <NavItem key={item.href} {...item} />)}
        </div>
        <div className="px-5 py-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isOnline ? 'var(--success)' : 'var(--text-quiet)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {isOnline ? 'Operational' : 'Not connected'}
          </span>
        </div>
      </div>
    </>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger button — shown in header area on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 w-8 h-8 flex items-center justify-center rounded-lg"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        aria-label="Open menu"
      >
        <Menu size={16} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 z-50 h-screen w-[240px] flex flex-col transition-transform duration-250',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: '#FAFAFA', borderRight: '1px solid var(--border)' }}
        data-sidebar="true"
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-[240px] flex-shrink-0 flex-col h-screen z-40"
        style={{ background: '#FAFAFA', borderRight: '1px solid var(--border)' }}
        data-sidebar="true"
      >
        <SidebarContent />
      </aside>
    </>
  )
}
