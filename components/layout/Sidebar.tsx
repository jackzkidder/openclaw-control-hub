'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Kanban,
  Bot,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAppStore } from '@/store/useAppStore'
import { ConnectionBadge } from '@/components/badges/ConnectionBadge'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { useTheme } from 'next-themes'

const navItems = [
  { href: '/',             icon: LayoutDashboard, label: 'Dashboard',    section: 'main' },
  { href: '/workshop',     icon: Kanban,          label: 'Workshop',     section: 'main' },
  { href: '/agents',       icon: Bot,             label: 'Agents',       section: 'main' },
  { href: '/automation',   icon: Clock,           label: 'Automation',   section: 'main' },
  { href: '/usage',        icon: DollarSign,      label: 'Usage & Cost', section: 'analytics' },
  { href: '/docu-digest',  icon: FileText,        label: 'Docu Digest',  section: 'analytics' },
  { href: '/conversations',icon: MessageSquare,   label: 'Conversations',section: 'analytics' },
  { href: '/settings',     icon: Settings,        label: 'Settings',     section: 'system' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { status } = useConnectionStatus()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { theme, setTheme } = useTheme()

  const mainItems    = navItems.filter((i) => i.section === 'main')
  const analyticsItems = navItems.filter((i) => i.section === 'analytics')
  const systemItems  = navItems.filter((i) => i.section === 'system')

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative flex-shrink-0 flex flex-col h-screen',
        'bg-surface-1/80 backdrop-blur-glass',
        'border-r border-white/[0.07]',
        'z-40 overflow-hidden'
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-primary" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <span className="text-sm font-bold text-foreground tracking-tight whitespace-nowrap">
                  Mission Control
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <NavSection
          items={mainItems}
          pathname={pathname}
          collapsed={sidebarCollapsed}
        />
        <div className="my-3 mx-3 border-t border-white/[0.05]" />
        <NavSection
          label="Analytics"
          items={analyticsItems}
          pathname={pathname}
          collapsed={sidebarCollapsed}
        />
        <div className="my-3 mx-3 border-t border-white/[0.05]" />
        <NavSection
          items={systemItems}
          pathname={pathname}
          collapsed={sidebarCollapsed}
        />
      </nav>

      {/* Theme toggle + Connection status */}
      <div className="border-t border-white/[0.06] dark:border-white/[0.06] flex-shrink-0">
        {/* Theme toggle */}
        <div className={cn('px-3 py-2', sidebarCollapsed && 'flex justify-center')}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              'flex items-center gap-2.5 px-2 py-1.5 rounded-lg w-full',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-white/[0.05] transition-colors',
              sidebarCollapsed && 'w-auto justify-center'
            )}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun size={14} className="flex-shrink-0 text-status-warning" />
            ) : (
              <Moon size={14} className="flex-shrink-0 text-primary" />
            )}
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.12 }}
                  className="text-xs font-medium whitespace-nowrap"
                >
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Connection status */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-4 pb-3"
            >
              <ConnectionBadge status={status} showLatency className="w-full justify-center" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-20',
          'w-6 h-6 rounded-full',
          'bg-surface-3 border border-white/[0.1]',
          'flex items-center justify-center',
          'text-muted-foreground hover:text-foreground',
          'transition-colors hover:bg-surface-4',
          'z-10'
        )}
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}

function NavSection({
  label,
  items,
  pathname,
  collapsed,
}: {
  label?: string
  items: typeof navItems
  pathname: string
  collapsed: boolean
}) {
  return (
    <div className="px-2">
      <AnimatePresence>
        {label && !collapsed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest"
          >
            {label}
          </motion.p>
        )}
      </AnimatePresence>
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              'group relative flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5',
              'text-sm transition-all duration-150',
              isActive
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 rounded-lg bg-primary/[0.08] border border-primary/20"
                transition={{ duration: 0.2 }}
              />
            )}
            <Icon size={16} className={cn('relative z-10 flex-shrink-0', isActive && 'text-primary')} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.12 }}
                  className="relative z-10 whitespace-nowrap font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        )
      })}
    </div>
  )
}
