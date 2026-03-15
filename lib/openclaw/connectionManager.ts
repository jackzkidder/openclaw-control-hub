import { GatewayClient } from './gatewayClient'
import { eventBus } from './eventBus'
import type { ConnectionState, AppSettings } from './types'

type MachineState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

class ConnectionManager {
  private client: GatewayClient | null = null
  private state: ConnectionState = {
    status: 'disconnected',
    gatewayUrl: null,
    connectedAt: null,
    lastPingAt: null,
    latencyMs: null,
    reconnectAttempts: 0,
    error: null,
    webhookReachable: null,
  }
  private reconnectTimer: NodeJS.Timeout | null = null
  private settings: Partial<AppSettings> = {}
  private intentionalDisconnect = false

  getState(): ConnectionState {
    return { ...this.state }
  }

  async connect(settings: Partial<AppSettings>): Promise<void> {
    this.settings = settings
    this.intentionalDisconnect = false

    if (!settings.gatewayUrl) {
      this.transition('error', 'No Gateway URL configured')
      return
    }

    this.clearReconnectTimer()
    this.disconnect()

    this.client = new GatewayClient({
      url: settings.gatewayUrl,
      apiKey: settings.apiKey ?? '',
      onStateChange: this.handleStateChange.bind(this),
    })

    this.client.connect()
  }

  disconnect(): void {
    this.intentionalDisconnect = true
    this.clearReconnectTimer()
    if (this.client) {
      this.client.disconnect()
      this.client = null
    }
    this.transition('disconnected')
  }

  isConnected(): boolean {
    return this.state.status === 'connected'
  }

  private handleStateChange(
    clientState: 'connecting' | 'connected' | 'disconnected' | 'error',
    error?: string
  ): void {
    switch (clientState) {
      case 'connecting':
        this.transition('connecting')
        break

      case 'connected':
        this.state.reconnectAttempts = 0
        this.state.connectedAt = new Date().toISOString()
        this.transition('connected')
        break

      case 'disconnected':
        if (!this.intentionalDisconnect) {
          this.scheduleReconnect()
        } else {
          this.transition('disconnected')
        }
        break

      case 'error':
        this.state.error = error ?? 'Unknown error'
        if (!this.intentionalDisconnect) {
          this.scheduleReconnect()
        } else {
          this.transition('error', error)
        }
        break
    }
  }

  private scheduleReconnect(): void {
    const maxAttempts = this.settings.maxReconnectAttempts ?? 10
    const baseInterval = this.settings.reconnectIntervalMs ?? 3000

    if (this.state.reconnectAttempts >= maxAttempts) {
      this.transition('error', `Max reconnect attempts (${maxAttempts}) exceeded`)
      return
    }

    this.transition('reconnecting')

    // Exponential backoff with jitter
    const backoff = Math.min(baseInterval * Math.pow(1.5, this.state.reconnectAttempts), 30_000)
    const jitter = backoff * 0.2 * (Math.random() - 0.5)
    const delay = Math.floor(backoff + jitter)

    this.state.reconnectAttempts++
    this.reconnectTimer = setTimeout(() => {
      if (!this.intentionalDisconnect && this.settings.gatewayUrl) {
        this.client = new GatewayClient({
          url: this.settings.gatewayUrl,
          apiKey: this.settings.apiKey ?? '',
          onStateChange: this.handleStateChange.bind(this),
        })
        this.client.connect()
      }
    }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private transition(status: MachineState, error?: string): void {
    this.state = {
      ...this.state,
      status,
      error: error ?? (status === 'connected' ? null : this.state.error),
    }
    eventBus.emitConnectionState(this.state)
  }
}

// Singleton
declare global {
  // eslint-disable-next-line no-var
  var __connectionManager: ConnectionManager | undefined
}

export const connectionManager: ConnectionManager =
  process.env.NODE_ENV === 'development'
    ? (global.__connectionManager ??= new ConnectionManager())
    : new ConnectionManager()
