import { getDb, initDb } from '../index'
import { nanoid } from 'nanoid'
import type { AppNotification } from '../../openclaw/types'

type Row = Record<string, unknown>

function rowToNotification(row: Row): AppNotification {
  return {
    id: String(row.id),
    type: row.type as AppNotification['type'],
    title: String(row.title),
    message: String(row.message),
    read: Boolean(row.read),
    createdAt: String(row.created_at),
  }
}

export async function getNotifications(limit = 50): Promise<AppNotification[]> {
  await initDb()
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?',
    args: [limit],
  })
  return (result.rows as Row[]).map(rowToNotification)
}

export async function createNotification(
  type: AppNotification['type'],
  title: string,
  message: string,
): Promise<AppNotification> {
  await initDb()
  const db = getDb()
  const id = nanoid()
  await db.execute({
    sql: 'INSERT INTO notifications (id, type, title, message) VALUES (?, ?, ?, ?)',
    args: [id, type, title, message],
  })
  const result = await db.execute({ sql: 'SELECT * FROM notifications WHERE id = ?', args: [id] })
  return rowToNotification(result.rows[0] as Row)
}

export async function markNotificationRead(id: string): Promise<void> {
  const db = getDb()
  await db.execute({ sql: 'UPDATE notifications SET read = 1 WHERE id = ?', args: [id] })
}

export async function markAllNotificationsRead(): Promise<void> {
  const db = getDb()
  await db.execute('UPDATE notifications SET read = 1')
}

export async function getUnreadCount(): Promise<number> {
  await initDb()
  const db = getDb()
  const result = await db.execute('SELECT COUNT(*) as count FROM notifications WHERE read = 0')
  return Number((result.rows[0] as Row)?.count ?? 0)
}
