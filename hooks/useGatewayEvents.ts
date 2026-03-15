'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'
import type { SSEMessage, GatewayEvent, HeartbeatPayload, AgentStatusChangedPayload } from '@/lib/openclaw/types'
import { nanoid } from 'nanoid'

export function useGatewayEvents() {
  const queryClient = useQueryClient()
  const esRef = useRef<EventSource | null>(null)
  const setConnectionState = useAppStore((s) => s.setConnectionState)
  const upsertAgent = useAppStore((s) => s.upsertAgent)
  const updateAgentStatus = useAppStore((s) => s.updateAgentStatus)
  const addEvent = useAppStore((s) => s.addEvent)
  const setHeartbeat = useAppStore((s) => s.setHeartbeat)

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout

    function connect() {
      if (esRef.current) {
        esRef.current.close()
      }

      const es = new EventSource('/api/openclaw/events')
      esRef.current = es

      es.onmessage = (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data) as SSEMessage
          handleMessage(msg)
        } catch {
          // skip malformed
        }
      }

      es.onerror = () => {
        es.close()
        esRef.current = null
        // Reconnect after 5s
        retryTimeout = setTimeout(connect, 5000)
      }
    }

    function handleMessage(msg: SSEMessage) {
      switch (msg.type) {
        case 'connection_state': {
          const state = msg.data as {
            status: string
            latencyMs: number | null
            gatewayUrl: string | null
            connectedAt: string | null
            reconnectAttempts: number
            error: string | null
            webhookReachable: boolean | null
          }
          setConnectionState({
            connectionStatus: state.status as never,
            latencyMs: state.latencyMs,
            gatewayUrl: state.gatewayUrl,
            connectedAt: state.connectedAt,
            reconnectAttempts: state.reconnectAttempts,
            connectionError: state.error,
            webhookReachable: state.webhookReachable,
          })
          break
        }

        case 'heartbeat': {
          const payload = msg.data as HeartbeatPayload
          setHeartbeat({
            serverTime: payload.serverTime,
            activeAgents: payload.activeAgents,
            queuedTasks: payload.queuedTasks,
          })
          addEvent({
            id: nanoid(),
            type: 'heartbeat',
            summary: `Heartbeat · ${payload.activeAgents} active agents · ${payload.queuedTasks} queued`,
            timestamp: msg.timestamp,
          })
          break
        }

        case 'gateway_event': {
          const event = msg.data as GatewayEvent
          handleGatewayEvent(event)
          break
        }
      }
    }

    function handleGatewayEvent(event: GatewayEvent) {
      addEvent({
        id: event.id,
        type: event.type,
        agentId: event.agentId,
        summary: summarizeEvent(event),
        timestamp: event.timestamp,
      })

      switch (event.type) {
        case 'agent.status_changed': {
          const p = event.payload as AgentStatusChangedPayload
          if (event.agentId) {
            updateAgentStatus(event.agentId, p.newStatus)
          }
          break
        }

        case 'gateway.connected':
          setConnectionState({ connectionStatus: 'connected' })
          queryClient.invalidateQueries({ queryKey: ['agents'] })
          break

        case 'gateway.disconnected':
          setConnectionState({ connectionStatus: 'disconnected' })
          break

        case 'usage.tick':
          queryClient.invalidateQueries({ queryKey: ['usage'] })
          break

        case 'task.created':
        case 'task.updated':
        case 'task.completed':
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          break
      }
    }

    connect()

    return () => {
      clearTimeout(retryTimeout)
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

function summarizeEvent(event: GatewayEvent): string {
  switch (event.type) {
    case 'agent.status_changed': {
      const p = event.payload as AgentStatusChangedPayload
      return `Agent ${event.agentId ?? 'unknown'} → ${p.newStatus}`
    }
    case 'agent.message':
      return `Message from agent ${event.agentId ?? 'unknown'}`
    case 'agent.tool_call':
      return `Tool call by agent ${event.agentId ?? 'unknown'}`
    case 'agent.error':
      return `Error in agent ${event.agentId ?? 'unknown'}`
    case 'task.created':
      return `Task created`
    case 'task.completed':
      return `Task completed`
    case 'usage.tick':
      return `Usage update`
    case 'gateway.connected':
      return 'Gateway connected'
    case 'gateway.disconnected':
      return 'Gateway disconnected'
    default:
      return event.type
  }
}
