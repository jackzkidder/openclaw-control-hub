import { NextResponse } from 'next/server'
import { connectionManager } from '@/lib/openclaw/connectionManager'
import { createWebhookClient } from '@/lib/openclaw/webhookClient'
import { getAllSettings } from '@/lib/db/queries/settings'

export async function GET() {
  try {
    const settings = await getAllSettings()
    const state = connectionManager.getState()

    // Quick webhook reachability check
    let webhookReachable = false
    if (settings.webhookBaseUrl) {
      const client = createWebhookClient(settings.webhookBaseUrl, settings.webhookToken)
      const result = await client.testConnection()
      webhookReachable = result.reachable
    }

    return NextResponse.json({
      ...state,
      webhookReachable,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
