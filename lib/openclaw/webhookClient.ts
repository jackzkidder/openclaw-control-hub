import type { WebhookRequest, WebhookResponse } from './types'

interface WebhookClientOptions {
  baseUrl: string
  token: string
}

export class WebhookClient {
  constructor(private options: WebhookClientOptions) {}

  async send(req: WebhookRequest): Promise<WebhookResponse> {
    const start = Date.now()
    const url = `${this.options.baseUrl.replace(/\/$/, '')}/webhook`

    const payload: Record<string, unknown> = {
      action: req.action,
    }

    if (req.agentId) payload.agent_id = req.agentId
    if (req.taskTitle) payload.task_title = req.taskTitle
    if (req.taskDescription) payload.task_description = req.taskDescription
    if (req.taskPayload) payload.task_payload = req.taskPayload
    if (req.runMode) payload.run_mode = req.runMode

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.token}`,
          'X-Source': 'mission-control',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      })

      let body: unknown
      try {
        body = await response.json()
      } catch {
        body = await response.text().catch(() => null)
      }

      return {
        status: response.status,
        ok: response.ok,
        body,
        latencyMs: Date.now() - start,
      }
    } catch (err) {
      return {
        status: 0,
        ok: false,
        body: { error: String(err) },
        latencyMs: Date.now() - start,
      }
    }
  }

  async testConnection(): Promise<{ reachable: boolean; latencyMs: number; error?: string }> {
    const start = Date.now()
    try {
      const url = `${this.options.baseUrl.replace(/\/$/, '')}/health`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.options.token}`,
        },
        signal: AbortSignal.timeout(8_000),
      })
      return {
        reachable: response.ok || response.status < 500,
        latencyMs: Date.now() - start,
      }
    } catch (err) {
      return {
        reachable: false,
        latencyMs: Date.now() - start,
        error: String(err),
      }
    }
  }
}

export function createWebhookClient(baseUrl: string, token: string): WebhookClient {
  return new WebhookClient({ baseUrl, token })
}
