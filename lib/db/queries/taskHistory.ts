import { getDb, initDb } from '../index'
import { nanoid } from 'nanoid'
import type { TaskHistoryEntry } from '../../openclaw/types'

type Row = Record<string, unknown>

function rowToEntry(row: Row): TaskHistoryEntry {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    field: String(row.field),
    oldValue: row.old_value != null ? String(row.old_value) : null,
    newValue: row.new_value != null ? String(row.new_value) : null,
    changedAt: String(row.changed_at),
  }
}

export async function getTaskHistory(taskId: string): Promise<TaskHistoryEntry[]> {
  await initDb()
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM task_history WHERE task_id = ? ORDER BY changed_at DESC',
    args: [taskId],
  })
  return (result.rows as Row[]).map(rowToEntry)
}

export async function logTaskChange(
  taskId: string,
  field: string,
  oldValue: string | null,
  newValue: string | null,
): Promise<void> {
  const db = getDb()
  const id = nanoid()
  await db.execute({
    sql: 'INSERT INTO task_history (id, task_id, field, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
    args: [id, taskId, field, oldValue, newValue],
  })
}
