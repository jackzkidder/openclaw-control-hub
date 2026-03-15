import { NextResponse } from 'next/server'
import { connectionManager } from '@/lib/openclaw/connectionManager'

export async function GET() {
  try {
    // When the gateway is connected, it pushes agent data via WebSocket events.
    // This endpoint returns what we know from the connection state.
    const state = connectionManager.getState()

    return NextResponse.json({
      connected: state.status === 'connected',
      agents: [], // Populated in real-time via the SSE event stream
      message:
        state.status !== 'connected'
          ? 'Connect to OpenClaw Gateway to see agents'
          : 'Agents are updated in real-time via the event stream',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
