import { NextRequest, NextResponse } from 'next/server'
import { createWebhookClient } from '@/lib/openclaw/webhookClient'
import { getAllSettings } from '@/lib/db/queries/settings'
import type { WebhookRequest } from '@/lib/openclaw/types'

export async function POST(req: NextRequest) {
  try {
    const settings = getAllSettings()
    if (!settings.webhookBaseUrl) {
      return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 400 })
    }
    const body = (await req.json()) as WebhookRequest
    const client = createWebhookClient(settings.webhookBaseUrl, settings.webhookToken)
    const result = await client.send(body)
    return NextResponse.json(result, { status: result.ok ? 200 : 502 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
