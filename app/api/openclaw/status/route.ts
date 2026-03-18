import { NextRequest, NextResponse } from 'next/server'
import { connectionManager } from '@/lib/openclaw/connectionManager'
import { createWebhookClient } from '@/lib/openclaw/webhookClient'
import { getAllSettings } from '@/lib/db/queries/settings'

export async function GET(req: NextRequest) {
  try {
    const state = connectionManager.getState()

    // Only run the live webhook check when explicitly requested (e.g. settings test).
    // Polling callers omit this to avoid unnecessary network overhead on every poll.
    const checkWebhook = req.nextUrl.searchParams.get('checkWebhook') === '1'
    let webhookReachable: boolean | null = state.webhookReachable

    if (checkWebhook) {
      const settings = await getAllSettings()
      if (settings.webhookBaseUrl) {
        const client = createWebhookClient(settings.webhookBaseUrl, settings.webhookToken)
        const result = await client.testConnection()
        webhookReachable = result.reachable
      } else {
        webhookReachable = null
      }
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
