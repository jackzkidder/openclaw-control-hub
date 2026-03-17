import { NextRequest, NextResponse } from 'next/server'
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from '@/lib/db/queries/alertRules'

export async function GET() {
  try {
    const rules = await getAlertRules()
    return NextResponse.json(rules)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, metric, threshold } = await req.json()
    if (!name || !metric || threshold == null) {
      return NextResponse.json({ error: 'name, metric, threshold required' }, { status: 400 })
    }
    const rule = await createAlertRule(name, metric, Number(threshold))
    return NextResponse.json(rule, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const rule = await updateAlertRule(id, updates)
    if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(rule)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    const ok = await deleteAlertRule(id)
    return NextResponse.json({ ok })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
