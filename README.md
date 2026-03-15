# Mission Control

A premium visual operating layer for your OpenClaw AI agent gateway.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure your OpenClaw connection
cp .env.example .env.local
# Edit .env.local with your gateway URL and tokens

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — first visit goes to the Dashboard.

## Configuration

Edit `.env.local`:

| Variable | Description | Example |
|---|---|---|
| `OPENCLAW_GATEWAY_URL` | WebSocket URL of your OpenClaw Gateway | `ws://localhost:8765` |
| `OPENCLAW_API_KEY` | Gateway authentication token | `sk-...` |
| `OPENCLAW_WEBHOOK_BASE_URL` | Base URL for webhook dispatch | `http://localhost:8766` |
| `OPENCLAW_WEBHOOK_TOKEN` | Webhook bearer token | `wh-...` |
| `OPENCLAW_DEFAULT_AGENT_ID` | Default agent ID | `main` |
| `DB_PATH` | SQLite database path | `./data/mission-control.db` |

You can also configure everything from the **Settings** page in the app — no restart needed.

## Architecture

```
OpenClaw Gateway (WebSocket)
        │
        ▼
lib/openclaw/connectionManager.ts   (server singleton)
        │
        ▼
lib/openclaw/eventBus.ts            (Node EventEmitter)
        │
        ▼
/api/openclaw/events                (Server-Sent Events stream)
        │
        ▼
hooks/useGatewayEvents.ts           (browser EventSource → Zustand)
        │
        ▼
React components                    (real-time UI)
```

**Key design decisions:**
- The WebSocket to OpenClaw runs **server-side only** — your API key never goes to the browser
- SQLite stores only Mission Control metadata (tasks, notes, cron UI state) — not OpenClaw runtime state
- SSE fans out gateway events to all connected browser tabs
- TanStack Query handles REST data; Zustand handles live/ephemeral state

## Pages

| Page | Path | Description |
|---|---|---|
| Dashboard | `/` | Command center with live metrics and activity feed |
| Workshop | `/workshop` | Kanban task planning board |
| Agents | `/agents` | Agent roster and status monitoring |
| Automation | `/automation` | Cron jobs and heartbeat visibility |
| Usage & Cost | `/usage` | Token usage and spending dashboards |
| Docu Digest | `/docu-digest` | Document upload and ingestion workspace |
| Conversations | `/conversations` | Live agent communication feed |
| Settings | `/settings` | Connection configuration and testing |

## Webhook Actions

Mission Control can dispatch work into OpenClaw via webhooks:

- **Wake Agent** — sends `wake_agent` action to the default or specified agent
- **Deploy Task** — sends `dispatch_task` with full task title/description
- **Queue for Heartbeat** — sends `queue_task` with `run_mode: next_heartbeat`

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + glassmorphism design system
- **Framer Motion** — page transitions and live animations
- **Recharts** — cost and usage charts
- **Zustand** + **TanStack Query** — state management
- **better-sqlite3** — local metadata storage
- **ws** — server-side WebSocket client
- **@dnd-kit** — Kanban drag and drop

## Future Plugin Integration

The codebase is structured so a custom OpenClaw plugin can enrich data without major refactoring:

1. Add plugin endpoint URLs to Settings
2. Extend `lib/openclaw/types.ts` with plugin-specific types
3. Add plugin API calls in `lib/openclaw/webhookClient.ts`
4. Consume new event types in `hooks/useGatewayEvents.ts`

Plugin endpoints can expose: custom RPC methods, richer usage aggregation, task metadata persistence, and custom agent telemetry.
