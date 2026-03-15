'use client'

import { useAppStore } from '@/store/useAppStore'

export function useConnectionStatus() {
  return {
    status: useAppStore((s) => s.connectionStatus),
    latencyMs: useAppStore((s) => s.latencyMs),
    connectedAt: useAppStore((s) => s.connectedAt),
    reconnectAttempts: useAppStore((s) => s.reconnectAttempts),
    webhookReachable: useAppStore((s) => s.webhookReachable),
    error: useAppStore((s) => s.connectionError),
    isConnected: useAppStore((s) => s.connectionStatus === 'connected'),
    isConnecting: useAppStore((s) =>
      s.connectionStatus === 'connecting' || s.connectionStatus === 'reconnecting'
    ),
  }
}
