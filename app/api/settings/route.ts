import { NextRequest, NextResponse } from 'next/server'
import { getAllSettings, setAllSettings } from '@/lib/db/queries/settings'

export async function GET() {
  try {
    const settings = await getAllSettings()
    // Mask sensitive values in response
    return NextResponse.json({
      ...settings,
      apiKey: settings.apiKey ? '••••••••' : '',
      webhookToken: settings.webhookToken ? '••••••••' : '',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    // Don't overwrite masked values
    if (body.apiKey === '••••••••') delete body.apiKey
    if (body.webhookToken === '••••••••') delete body.webhookToken
    await setAllSettings(body)
    const updated = await getAllSettings()
    return NextResponse.json({
      ...updated,
      apiKey: updated.apiKey ? '••••••••' : '',
      webhookToken: updated.webhookToken ? '••••••••' : '',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
