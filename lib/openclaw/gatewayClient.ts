import WebSocket from 'ws'
import { nanoid } from 'nanoid'
import type { GatewayEvent, GatewayEventType } from './types'
import { eventBus } from './eventBus'

interface GatewayClientOptions {
  url: string
  apiKey: string
  onStateChange: (state: 'connecting' | 'connected' | 'disconnected' | 'error', error?: string) => void
}

export class GatewayClient {
  private ws: WebSocket | null = null
  private options: GatewayClientOptions
  private pingInterval: NodeJS.Timeout | null = null
  private pingStart: number = 0

  constructor(options: GatewayClientOptions) {
    this.options = options
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.options.onStateChange('connecting')

    try {
      this.ws = new WebSocket(this.options.url, {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'X-Client': 'mission-control',
          'X-Client-Version': '1.0.0',
        },
      })

      this.ws.on('open', this.handleOpen.bind(this))
      this.ws.on('message', this.handleMessage.bind(this))
      this.ws.on('close', this.handleClose.bind(this))
      this.ws.on('error', this.handleError.bind(this))
    } catch (err) {
      this.options.onStateChange('error', String(err))
    }
  }

  disconnect(): void {
    this.stopPing()
    if (this.ws) {
      this.ws.removeAllListeners()
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  send(data: unknown): boolean {
    if (!this.isConnected()) return false
    try {
      this.ws!.send(JSON.stringify(data))
      return true
    } catch {
      return false
    }
  }

  private handleOpen(): void {
    this.options.onStateChange('connected')
    this.startPing()

    // Emit a synthetic connected event
    eventBus.emitGatewayEvent({
      id: nanoid(),
      type: 'gateway.connected' as GatewayEventType,
      timestamp: new Date().toISOString(),
      payload: { message: 'Gateway connected' },
    })
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const raw = data.toString()
      const parsed = JSON.parse(raw) as GatewayEvent

      // Handle pong
      if ((parsed as unknown as { type: string }).type === 'pong') {
        const latency = Date.now() - this.pingStart
        eventBus.emitConnectionState({
          status: 'connected',
          gatewayUrl: this.options.url,
          connectedAt: null,
          lastPingAt: new Date().toISOString(),
          latencyMs: latency,
          reconnectAttempts: 0,
          error: null,
          webhookReachable: null,
        })
        return
      }

      // Forward all gateway events to SSE clients
      if (parsed.type === 'heartbeat') {
        eventBus.emitHeartbeat(parsed.payload)
      }

      eventBus.emitGatewayEvent(parsed)
    } catch {
      // Malformed message — log but don't crash
      console.warn('[GatewayClient] Failed to parse message:', data.toString().slice(0, 200))
    }
  }

  private handleClose(code: number, reason: Buffer): void {
    this.stopPing()
    const msg = reason.toString() || `Code ${code}`
    this.options.onStateChange('disconnected', msg)

    eventBus.emitGatewayEvent({
      id: nanoid(),
      type: 'gateway.disconnected' as GatewayEventType,
      timestamp: new Date().toISOString(),
      payload: { code, reason: msg },
    })
  }

  private handleError(err: Error): void {
    this.options.onStateChange('error', err.message)
    eventBus.emitError(err.message)
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.pingStart = Date.now()
        this.send({ type: 'ping', id: nanoid() })
      }
    }, 25_000)
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}
