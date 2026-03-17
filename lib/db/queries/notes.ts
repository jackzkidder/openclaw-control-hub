import { getDb, initDb } from '../index'
import { nanoid } from 'nanoid'
import type { Note } from '../../openclaw/types'

type Row = Record<string, unknown>

function rowToNote(row: Row): Note {
  return {
    id: String(row.id),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    content: String(row.content),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export async function getNotes(entityType: string, entityId: string): Promise<Note[]> {
  await initDb()
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM notes WHERE entity_type = ? AND entity_id = ? ORDER BY created_at ASC',
    args: [entityType, entityId],
  })
  return (result.rows as Row[]).map(rowToNote)
}

export async function createNote(entityType: string, entityId: string, content: string): Promise<Note> {
  await initDb()
  const db = getDb()
  const id = nanoid()
  const now = new Date().toISOString()
  await db.execute({
    sql: 'INSERT INTO notes (id, entity_type, entity_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, entityType, entityId, content, now, now],
  })
  const result = await db.execute({ sql: 'SELECT * FROM notes WHERE id = ?', args: [id] })
  return rowToNote(result.rows[0] as Row)
}

export async function deleteNote(id: string): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({ sql: 'DELETE FROM notes WHERE id = ?', args: [id] })
  return (result.rowsAffected ?? 0) > 0
}
