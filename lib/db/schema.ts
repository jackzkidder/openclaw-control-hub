// Each migration is an array of individual SQL statements
// @libsql/client executes one statement per call

export const SCHEMA_VERSION = 2

export const migrations: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS schema_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id                   TEXT PRIMARY KEY,
      title                TEXT NOT NULL,
      description          TEXT NOT NULL DEFAULT '',
      status               TEXT NOT NULL DEFAULT 'backlog',
      priority             TEXT NOT NULL DEFAULT 'medium',
      assigned_agent_id    TEXT,
      tags                 TEXT NOT NULL DEFAULT '[]',
      column_order         INTEGER NOT NULL DEFAULT 0,
      momentum_score       REAL NOT NULL DEFAULT 0.0,
      due_at               TEXT,
      completed_at         TEXT,
      created_at           TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
      deployed_to_openclaw INTEGER NOT NULL DEFAULT 0,
      openclaw_task_id     TEXT,
      metadata             TEXT NOT NULL DEFAULT '{}'
    )`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_agent_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_order    ON tasks(status, column_order)`,
    `CREATE TABLE IF NOT EXISTS documents (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      mime_type      TEXT NOT NULL,
      size_bytes     INTEGER NOT NULL,
      status         TEXT NOT NULL DEFAULT 'pending',
      chunk_count    INTEGER,
      summary        TEXT,
      error_message  TEXT,
      uploaded_at    TEXT NOT NULL DEFAULT (datetime('now')),
      processed_at   TEXT,
      linked_task_ids  TEXT NOT NULL DEFAULT '[]',
      linked_agent_ids TEXT NOT NULL DEFAULT '[]',
      metadata       TEXT NOT NULL DEFAULT '{}'
    )`,
    `CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)`,
    `CREATE TABLE IF NOT EXISTS cron_jobs (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      expression      TEXT NOT NULL,
      description     TEXT NOT NULL DEFAULT '',
      agent_id        TEXT,
      webhook_url     TEXT,
      is_enabled      INTEGER NOT NULL DEFAULT 1,
      last_run_at     TEXT,
      last_run_status TEXT,
      next_run_at     TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS usage_snapshots (
      id            TEXT PRIMARY KEY,
      agent_id      TEXT NOT NULL,
      model         TEXT NOT NULL,
      period_date   TEXT NOT NULL,
      input_tokens  INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      cost_usd      REAL NOT NULL DEFAULT 0.0,
      recorded_at   TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_agent_date ON usage_snapshots(agent_id, model, period_date)`,
    `CREATE INDEX IF NOT EXISTS idx_usage_date ON usage_snapshots(period_date)`,
    `CREATE TABLE IF NOT EXISTS event_log (
      id              TEXT PRIMARY KEY,
      type            TEXT NOT NULL,
      agent_id        TEXT,
      conversation_id TEXT,
      task_id         TEXT,
      payload         TEXT NOT NULL DEFAULT '{}',
      received_at     TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_event_log_type     ON event_log(type)`,
    `CREATE INDEX IF NOT EXISTS idx_event_log_agent    ON event_log(agent_id)`,
    `CREATE INDEX IF NOT EXISTS idx_event_log_received ON event_log(received_at)`,
    `CREATE TABLE IF NOT EXISTS notes (
      id          TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id   TEXT NOT NULL,
      content     TEXT NOT NULL DEFAULT '',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(entity_type, entity_id)`,
    `INSERT OR IGNORE INTO schema_meta(key, value) VALUES ('version', '1')`,
  ],
  2: [
    `CREATE TABLE IF NOT EXISTS task_history (
      id         TEXT PRIMARY KEY,
      task_id    TEXT NOT NULL,
      field      TEXT NOT NULL,
      old_value  TEXT,
      new_value  TEXT,
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_id)`,
    `CREATE TABLE IF NOT EXISTS cron_run_history (
      id          TEXT PRIMARY KEY,
      cron_job_id TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'success',
      started_at  TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT,
      output      TEXT,
      error       TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_cron_history_job ON cron_run_history(cron_job_id)`,
    `CREATE TABLE IF NOT EXISTS alert_rules (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      metric     TEXT NOT NULL,
      threshold  REAL NOT NULL,
      enabled    INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      type       TEXT NOT NULL,
      title      TEXT NOT NULL,
      message    TEXT NOT NULL,
      read       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`,
    `INSERT OR REPLACE INTO schema_meta(key, value) VALUES ('version', '2')`,
  ],
}
