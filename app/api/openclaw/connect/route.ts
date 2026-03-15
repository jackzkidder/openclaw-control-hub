import { NextResponse } from 'next/server'
import { connectionManager } from '@/lib/openclaw/connectionManager'
import { getAllSettings } from '@/lib/db/queries/settings'

export async function POST() {
  try {
    const settings = await getAllSettings()
    if (!settings.gatewayUrl) {
      return NextResponse.json({ error: 'Gateway URL not configured' }, { status: 400 })
    }
    await connectionManager.connect(settings)
    return NextResponse.json({ ok: true, message: 'Connection initiated' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    connectionManager.disconnect()
    return NextResponse.json({ ok: true, message: 'Disconnected' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
