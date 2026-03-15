import { getDb, initDb } from '../index'
import { nanoid } from 'nanoid'
import type { Document } from '../../openclaw/types'

type Row = Record<string, unknown>

function rowToDocument(row: Row): Document {
  return {
    id: String(row.id),
    name: String(row.name),
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes),
    status: row.status as Document['status'],
    chunkCount: row.chunk_count != null ? Number(row.chunk_count) : null,
    summary: row.summary != null ? String(row.summary) : null,
    errorMessage: row.error_message != null ? String(row.error_message) : null,
    uploadedAt: String(row.uploaded_at),
    processedAt: row.processed_at != null ? String(row.processed_at) : null,
    linkedTaskIds: JSON.parse(String(row.linked_task_ids ?? '[]')),
    linkedAgentIds: JSON.parse(String(row.linked_agent_ids ?? '[]')),
    metadata: JSON.parse(String(row.metadata ?? '{}')),
  }
}

export async function getAllDocuments(): Promise<Document[]> {
  await initDb()
  const db = getDb()
  const result = await db.execute('SELECT * FROM documents ORDER BY uploaded_at DESC')
  return (result.rows as Row[]).map(rowToDocument)
}

export async function getDocumentById(id: string): Promise<Document | null> {
  await initDb()
  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM documents WHERE id = ?', args: [id] })
  if (!result.rows.length) return null
  return rowToDocument(result.rows[0] as Row)
}

export async function createDocument(input: {
  name: string
  mimeType: string
  sizeBytes: number
}): Promise<Document> {
  await initDb()
  const db = getDb()
  const id = nanoid()
  await db.execute({
    sql: `INSERT INTO documents (id, name, mime_type, size_bytes, status) VALUES (?, ?, ?, ?, 'pending')`,
    args: [id, input.name, input.mimeType, input.sizeBytes],
  })
  return (await getDocumentById(id))!
}

export async function updateDocumentStatus(
  id: string,
  status: Document['status'],
  opts?: { chunkCount?: number; summary?: string; errorMessage?: string; processedAt?: string }
): Promise<Document | null> {
  const db = getDb()
  const existing = await getDocumentById(id)
  if (!existing) return null

  await db.execute({
    sql: `UPDATE documents SET
      status        = ?,
      chunk_count   = ?,
      summary       = ?,
      error_message = ?,
      processed_at  = ?
    WHERE id = ?`,
    args: [
      status,
      opts?.chunkCount ?? existing.chunkCount,
      opts?.summary ?? existing.summary,
      opts?.errorMessage ?? existing.errorMessage,
      opts?.processedAt ?? existing.processedAt,
      id,
    ],
  })
  return getDocumentById(id)
}

export async function deleteDocument(id: string): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({ sql: 'DELETE FROM documents WHERE id = ?', args: [id] })
  return (result.rowsAffected ?? 0) > 0
}
