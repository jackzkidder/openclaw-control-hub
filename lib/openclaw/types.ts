// ─── Connection ───────────────────────────────────────────────────────────────

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

export interface ConnectionState {
  status: ConnectionStatus
  gatewayUrl: string | null
  connectedAt: string | null
  lastPingAt: string | null
  latencyMs: number | null
  reconnectAttempts: number
  error: string | null
  webhookReachable: boolean | null
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'offline'

export type AgentCapability =
  | 'code'
  | 'web_search'
  | 'file_io'
  | 'memory'
  | 'tool_use'
  | 'vision'
  | 'browser'

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalCost: number
}

export interface Agent {
  id: string
  name: string
  model: string
  status: AgentStatus
  description: string
  avatarUrl?: string
  tags: string[]
  capabilities: AgentCapability[]
  tokensUsed: TokenUsage
  parentAgentId?: string
  childAgentIds: string[]
  createdAt: string
  lastActiveAt: string | null
  currentTask?: string
  metadata: Record<string, unknown>
}

// ─── Gateway Events ───────────────────────────────────────────────────────────

export type GatewayEventType =
  | 'agent.status_changed'
  | 'agent.message'
  | 'agent.tool_call'
  | 'agent.tool_result'
  | 'agent.error'
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'usage.tick'
  | 'heartbeat'
  | 'gateway.connected'
  | 'gateway.disconnected'
  | 'system.health'

export interface GatewayEvent<T = unknown> {
  id: string
  type: GatewayEventType
  agentId?: string
  conversationId?: string
  taskId?: string
  timestamp: string
  payload: T
}

export interface AgentStatusChangedPayload {
  previousStatus: AgentStatus
  newStatus: AgentStatus
  reason?: string
}

export interface AgentMessagePayload {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  conversationId: string
  sequenceNumber: number
}

export interface ToolCallPayload {
  toolName: string
  toolInput: Record<string, unknown>
  toolUseId: string
}

export interface ToolResultPayload {
  toolUseId: string
  toolName: string
  output: string
  isError: boolean
}

export interface UsageTickPayload {
  agentId: string
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  periodStart: string
  periodEnd: string
}

export interface HeartbeatPayload {
  serverTime: string
  activeAgents: number
  queuedTasks: number
  systemLoad?: number
}

export interface SystemHealthPayload {
  cpuPercent?: number
  memoryPercent?: number
  diskPercent?: number
  uptime?: number
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignedAgentId: string | null
  tags: string[]
  columnOrder: number
  momentumScore: number
  dueAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  deployedToOpenClaw: boolean
  openClawTaskId: string | null
  metadata: Record<string, unknown>
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignedAgentId?: string
  tags?: string[]
  dueAt?: string
  momentumScore?: number
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string
  columnOrder?: number
  completedAt?: string
  deployedToOpenClaw?: boolean
  openClawTaskId?: string
}

// ─── Conversations ────────────────────────────────────────────────────────────

export interface Conversation {
  id: string
  title: string
  agentId: string
  agentName: string
  model: string
  messageCount: number
  lastMessageAt: string
  createdAt: string
  isActive: boolean
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  toolName?: string
  toolUseId?: string
  inputTokens?: number
  outputTokens?: number
  timestamp: string
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface Document {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  status: DocumentStatus
  chunkCount: number | null
  summary: string | null
  errorMessage: string | null
  uploadedAt: string
  processedAt: string | null
  linkedTaskIds: string[]
  linkedAgentIds: string[]
  metadata: Record<string, unknown>
}

// ─── Automation / Cron ────────────────────────────────────────────────────────

export interface CronJob {
  id: string
  name: string
  expression: string
  description: string
  agentId: string | null
  webhookUrl: string | null
  isEnabled: boolean
  lastRunAt: string | null
  lastRunStatus: 'success' | 'failure' | null
  nextRunAt: string | null
  createdAt: string
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  gatewayUrl: string
  apiKey: string
  webhookBaseUrl: string
  webhookToken: string
  defaultAgentId: string
  tailscaleUrl: string
  reconnectIntervalMs: number
  maxReconnectAttempts: number
  theme: 'dark' | 'system'
  accentColor: 'cyan' | 'violet' | 'emerald' | 'rose'
  sidebarCollapsed: boolean
  notificationsEnabled: boolean
  appName: string
  setupCompleted: boolean
  monthlyBudget: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  gatewayUrl: process.env.OPENCLAW_GATEWAY_URL ?? 'ws://localhost:8765',
  apiKey: process.env.OPENCLAW_API_KEY ?? '',
  webhookBaseUrl: process.env.OPENCLAW_WEBHOOK_BASE_URL ?? 'http://localhost:8766',
  webhookToken: process.env.OPENCLAW_WEBHOOK_TOKEN ?? '',
  defaultAgentId: process.env.OPENCLAW_DEFAULT_AGENT_ID ?? 'main',
  tailscaleUrl: '',
  reconnectIntervalMs: 3000,
  maxReconnectAttempts: 10,
  theme: 'dark',
  accentColor: 'cyan',
  sidebarCollapsed: false,
  notificationsEnabled: true,
  appName: 'Mission Control',
  setupCompleted: false,
  monthlyBudget: 100,
}

// ─── Usage / Cost ─────────────────────────────────────────────────────────────

export interface UsageDataPoint {
  date: string
  agentId: string
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
}

export interface UsageSummary {
  totalInputTokens: number
  totalOutputTokens: number
  totalCostUsd: number
  byAgent: Record<string, TokenUsage>
  byModel: Record<string, TokenUsage>
  dailyTrend: UsageDataPoint[]
  totalTokensToday?: number
  promptTokensToday?: number
  completionTokensToday?: number
  totalCostToday?: number
  costTrendPercent?: number | null
  mostActiveAgent?: { name: string; tokens: number } | null
  costYesterday?: number
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export type WebhookAction = 'wake_agent' | 'dispatch_task' | 'queue_task' | 'run_now'

export interface WebhookRequest {
  action: WebhookAction
  agentId?: string
  taskTitle?: string
  taskDescription?: string
  taskPayload?: Record<string, unknown>
  runMode?: 'immediate' | 'next_heartbeat'
}

export interface WebhookResponse {
  status: number
  ok: boolean
  body: unknown
  latencyMs: number
}

// ─── Notes / Comments ─────────────────────────────────────────────────────────

export interface Note {
  id: string
  entityType: string
  entityId: string
  content: string
  createdAt: string
  updatedAt: string
}

// ─── Task History ─────────────────────────────────────────────────────────────

export interface TaskHistoryEntry {
  id: string
  taskId: string
  field: string
  oldValue: string | null
  newValue: string | null
  changedAt: string
}

// ─── Cron Run History ─────────────────────────────────────────────────────────

export interface CronRunHistory {
  id: string
  cronJobId: string
  status: 'success' | 'failure' | 'running'
  startedAt: string
  finishedAt: string | null
  output: string | null
  error: string | null
}

// ─── Alert Rules ──────────────────────────────────────────────────────────────

export type AlertMetric = 'daily_cost' | 'monthly_cost' | 'agent_offline' | 'task_overdue'

export interface AlertRule {
  id: string
  name: string
  metric: AlertMetric
  threshold: number
  enabled: boolean
  createdAt: string
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string
  type: 'alert' | 'info' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: string
}

// ─── SSE Events (internal) ────────────────────────────────────────────────────

export interface SSEMessage {
  type: 'gateway_event' | 'connection_state' | 'heartbeat' | 'error'
  data: unknown
  timestamp: string
}
