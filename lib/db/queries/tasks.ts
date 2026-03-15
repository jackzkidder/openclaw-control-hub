import { getDb, initDb } from '../index'
import { nanoid } from 'nanoid'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../openclaw/types'

type Row = Record<string, unknown>

function rowToTask(row: Row): Task {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description ?? ''),
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    assignedAgentId: row.assigned_agent_id != null ? String(row.assigned_agent_id) : null,
    tags: JSON.parse(String(row.tags ?? '[]')),
    columnOrder: Number(row.column_order ?? 0),
    momentumScore: Number(row.momentum_score ?? 0),
    dueAt: row.due_at != null ? String(row.due_at) : null,
    completedAt: row.completed_at != null ? String(row.completed_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deployedToOpenClaw: Boolean(row.deployed_to_openclaw),
    openClawTaskId: row.openclaw_task_id != null ? String(row.openclaw_task_id) : null,
    metadata: JSON.parse(String(row.metadata ?? '{}')),
  }
}

export async function getAllTasks(): Promise<Task[]> {
  await initDb()
  const db = getDb()
  const result = await db.execute('SELECT * FROM tasks ORDER BY status, column_order ASC')
  return (result.rows as Row[]).map(rowToTask)
}

export async function getTaskById(id: string): Promise<Task | null> {
  await initDb()
  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [id] })
  if (!result.rows.length) return null
  return rowToTask(result.rows[0] as Row)
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  await initDb()
  const db = getDb()
  const id = nanoid()
  const now = new Date().toISOString()
  const status = input.status ?? 'backlog'

  const maxResult = await db.execute({
    sql: 'SELECT MAX(column_order) as max FROM tasks WHERE status = ?',
    args: [status],
  })
  const maxOrder = Number((maxResult.rows[0] as Row)?.max ?? -1)

  await db.execute({
    sql: `INSERT INTO tasks (
      id, title, description, status, priority,
      assigned_agent_id, tags, column_order, momentum_score,
      due_at, created_at, updated_at, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.title,
      input.description ?? '',
      status,
      input.priority ?? 'medium',
      input.assignedAgentId ?? null,
      JSON.stringify(input.tags ?? []),
      maxOrder + 1,
      input.momentumScore ?? 0,
      input.dueAt ?? null,
      now,
      now,
      '{}',
    ],
  })

  return (await getTaskById(id))!
}

export async function updateTask(input: UpdateTaskInput): Promise<Task | null> {
  const existing = await getTaskById(input.id)
  if (!existing) return null

  const db = getDb()
  const now = new Date().toISOString()

  await db.execute({
    sql: `UPDATE tasks SET
      title             = ?,
      description       = ?,
      status            = ?,
      priority          = ?,
      assigned_agent_id = ?,
      tags              = ?,
      column_order      = ?,
      momentum_score    = ?,
      due_at            = ?,
      completed_at      = ?,
      updated_at        = ?,
      deployed_to_openclaw = ?,
      openclaw_task_id  = ?
    WHERE id = ?`,
    args: [
      input.title ?? existing.title,
      input.description ?? existing.description,
      input.status ?? existing.status,
      input.priority ?? existing.priority,
      input.assignedAgentId !== undefined ? input.assignedAgentId : existing.assignedAgentId,
      JSON.stringify(input.tags ?? existing.tags),
      input.columnOrder !== undefined ? input.columnOrder : existing.columnOrder,
      input.momentumScore !== undefined ? input.momentumScore : existing.momentumScore,
      input.dueAt !== undefined ? input.dueAt : existing.dueAt,
      input.completedAt !== undefined ? input.completedAt : existing.completedAt,
      now,
      input.deployedToOpenClaw !== undefined ? Number(input.deployedToOpenClaw) : Number(existing.deployedToOpenClaw),
      input.openClawTaskId !== undefined ? input.openClawTaskId : existing.openClawTaskId,
      input.id,
    ],
  })

  return getTaskById(input.id)
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [id] })
  return (result.rowsAffected ?? 0) > 0
}
