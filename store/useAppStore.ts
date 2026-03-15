import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { ConnectionStatus, Agent, AgentStatus } from '@/lib/openclaw/types'

// ─── Connection Slice ─────────────────────────────────────────────────────────

interface ConnectionSlice {
  connectionStatus: ConnectionStatus
  gatewayUrl: string | null
  latencyMs: number | null
  connectedAt: string | null
  reconnectAttempts: number
  webhookReachable: boolean | null
  connectionError: string | null
  setConnectionState: (state: Partial<ConnectionSlice>) => void
}

// ─── Agents Slice ─────────────────────────────────────────────────────────────

interface AgentsSlice {
  agents: Record<string, Agent>
  upsertAgent: (agent: Agent) => void
  updateAgentStatus: (id: string, status: AgentStatus) => void
  removeAgent: (id: string) => void
  clearAgents: () => void
}

// ─── Live Events Slice ────────────────────────────────────────────────────────

interface LiveEvent {
  id: string
  type: string
  agentId?: string
  summary: string
  timestamp: string
}

interface EventsSlice {
  recentEvents: LiveEvent[]
  activeHeartbeat: {
    serverTime: string
    activeAgents: number
    queuedTasks: number
    lastAt: string
  } | null
  addEvent: (event: LiveEvent) => void
  setHeartbeat: (payload: { serverTime: string; activeAgents: number; queuedTasks: number }) => void
}

// ─── UI Slice ─────────────────────────────────────────────────────────────────

interface UISlice {
  sidebarCollapsed: boolean
  activeModal: string | null
  accentColor: 'cyan' | 'violet' | 'emerald' | 'rose'
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  openModal: (id: string) => void
  closeModal: () => void
  setAccentColor: (color: UISlice['accentColor']) => void
}

// ─── Combined Store ───────────────────────────────────────────────────────────

export type AppStore = ConnectionSlice & AgentsSlice & EventsSlice & UISlice

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set) => ({
          // Connection
          connectionStatus: 'disconnected' as ConnectionStatus,
          gatewayUrl: null,
          latencyMs: null,
          connectedAt: null,
          reconnectAttempts: 0,
          webhookReachable: null,
          connectionError: null,
          setConnectionState: (state) =>
            set((s) => {
              Object.assign(s, state)
            }),

          // Agents
          agents: {},
          upsertAgent: (agent) =>
            set((s) => {
              s.agents[agent.id] = agent
            }),
          updateAgentStatus: (id, status) =>
            set((s) => {
              if (s.agents[id]) s.agents[id].status = status
            }),
          removeAgent: (id) =>
            set((s) => {
              delete s.agents[id]
            }),
          clearAgents: () =>
            set((s) => {
              s.agents = {}
            }),

          // Events
          recentEvents: [],
          activeHeartbeat: null,
          addEvent: (event) =>
            set((s) => {
              s.recentEvents.unshift(event)
              if (s.recentEvents.length > 100) {
                s.recentEvents = s.recentEvents.slice(0, 100)
              }
            }),
          setHeartbeat: (payload) =>
            set((s) => {
              s.activeHeartbeat = { ...payload, lastAt: new Date().toISOString() }
            }),

          // UI
          sidebarCollapsed: false,
          activeModal: null,
          accentColor: 'cyan',
          toggleSidebar: () =>
            set((s) => {
              s.sidebarCollapsed = !s.sidebarCollapsed
            }),
          setSidebarCollapsed: (v) =>
            set((s) => {
              s.sidebarCollapsed = v
            }),
          openModal: (id) =>
            set((s) => {
              s.activeModal = id
            }),
          closeModal: () =>
            set((s) => {
              s.activeModal = null
            }),
          setAccentColor: (color) =>
            set((s) => {
              s.accentColor = color
            }),
        }))
      ),
      {
        name: 'mc-store',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          accentColor: state.accentColor,
        }),
      }
    )
  )
)

// Convenience selectors
export const useConnectionStatus = () => useAppStore((s) => s.connectionStatus)
export const useAgents = () => useAppStore((s) => Object.values(s.agents))
export const useRecentEvents = () => useAppStore((s) => s.recentEvents)
export const useHeartbeat = () => useAppStore((s) => s.activeHeartbeat)
