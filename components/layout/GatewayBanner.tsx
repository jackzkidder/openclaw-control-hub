'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function GatewayBanner() {
  const connectionStatus = useAppStore((s) => s.connectionStatus)
  const reconnectAttempts = useAppStore((s) => s.reconnectAttempts)
  const connectionError = useAppStore((s) => s.connectionError)
  const [dismissed, setDismissed] = useState(false)

  const isDisconnected = connectionStatus === 'disconnected' || connectionStatus === 'error'
  const isReconnecting = connectionStatus === 'reconnecting'
  const show = (isDisconnected || isReconnecting) && !dismissed

  async function handleReconnect() {
    setDismissed(false)
    try {
      await fetch('/api/openclaw/connect', { method: 'POST' })
    } catch {
      // ignore
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 overflow-hidden"
          style={{
            background: isReconnecting ? 'rgba(180,83,9,0.08)' : 'rgba(185,28,28,0.08)',
            borderBottom: `1px solid ${isReconnecting ? 'rgba(180,83,9,0.2)' : 'rgba(185,28,28,0.2)'}`,
          }}
        >
          <div className="flex items-center gap-2.5 px-6 py-2">
            {isReconnecting ? (
              <RefreshCw size={13} className="animate-spin flex-shrink-0" style={{ color: 'var(--warning)' }} />
            ) : (
              <WifiOff size={13} className="flex-shrink-0" style={{ color: 'var(--danger)' }} />
            )}
            <span className="text-xs font-medium flex-1" style={{ color: isReconnecting ? 'var(--warning)' : 'var(--danger)' }}>
              {isReconnecting
                ? `Reconnecting to gateway… (attempt ${reconnectAttempts})`
                : connectionError
                ? `Gateway disconnected: ${connectionError}`
                : 'Gateway disconnected'}
            </span>
            {!isReconnecting && (
              <button
                onClick={handleReconnect}
                className="text-[11px] font-semibold px-2 py-1 rounded transition-colors"
                style={{ color: 'var(--danger)', background: 'rgba(185,28,28,0.1)' }}
              >
                Reconnect
              </button>
            )}
            <button onClick={() => setDismissed(true)} style={{ color: 'var(--text-quiet)' }}>
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
