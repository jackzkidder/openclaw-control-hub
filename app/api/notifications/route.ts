import { NextRequest, NextResponse } from 'next/server'
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from '@/lib/db/queries/notifications'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const countOnly = searchParams.get('countOnly') === '1'
  try {
    if (countOnly) {
      const count = await getUnreadCount()
      return NextResponse.json({ count })
    }
    const notifications = await getNotifications()
    return NextResponse.json(notifications)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, title, message } = await req.json()
    if (!type || !title || !message) {
      return NextResponse.json({ error: 'type, title, message required' }, { status: 400 })
    }
    const notification = await createNotification(type, title, message)
    return NextResponse.json(notification, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, readAll } = await req.json()
    if (readAll) {
      await markAllNotificationsRead()
      return NextResponse.json({ ok: true })
    }
    if (id) {
      await markNotificationRead(id)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'id or readAll required' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
