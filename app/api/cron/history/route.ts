import { NextRequest, NextResponse } from 'next/server'
import { getCronHistory, logCronRun } from '@/lib/db/queries/cronHistory'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cronJobId = searchParams.get('cronJobId')
  if (!cronJobId) return NextResponse.json({ error: 'cronJobId required' }, { status: 400 })
  try {
    const history = await getCronHistory(cronJobId)
    return NextResponse.json(history)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { cronJobId, status, output, error } = await req.json()
    if (!cronJobId || !status) return NextResponse.json({ error: 'cronJobId and status required' }, { status: 400 })
    const run = await logCronRun(cronJobId, status, output, error)
    return NextResponse.json(run, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
