import { EventEmitter } from 'events'
import type { GatewayEvent, ConnectionState, SSEMessage } from './types'

class GatewayEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100) // support many SSE clients
  }

  emitGatewayEvent(event: GatewayEvent): void {
    const msg: SSEMessage = {
      type: 'gateway_event',
      data: event,
      timestamp: new Date().toISOString(),
    }
    this.emit('message', msg)
    this.emit(`event:${event.type}`, event)
  }

  emitConnectionState(state: ConnectionState): void {
    const msg: SSEMessage = {
      type: 'connection_state',
      data: state,
      timestamp: new Date().toISOString(),
    }
    this.emit('message', msg)
  }

  emitHeartbeat(payload: unknown): void {
    const msg: SSEMessage = {
      type: 'heartbeat',
      data: payload,
      timestamp: new Date().toISOString(),
    }
    this.emit('message', msg)
  }

  emitError(error: string): void {
    const msg: SSEMessage = {
      type: 'error',
      data: { message: error },
      timestamp: new Date().toISOString(),
    }
    this.emit('message', msg)
  }

  onMessage(listener: (msg: SSEMessage) => void): () => void {
    this.on('message', listener)
    return () => this.off('message', listener)
  }
}

// Singleton — survives Next.js dev hot reloads via global
declare global {
  // eslint-disable-next-line no-var
  var __gatewayEventBus: GatewayEventBus | undefined
}

export const eventBus: GatewayEventBus =
  process.env.NODE_ENV === 'development'
    ? (global.__gatewayEventBus ??= new GatewayEventBus())
    : new GatewayEventBus()
