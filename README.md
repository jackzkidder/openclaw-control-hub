# OpenClaw Control

A modern operations dashboard for OpenClaw — monitor agents, tasks, automation, and gateway connections from a single interface.

## Features

- Real-time agent and task monitoring via WebSocket + SSE
- Kanban board (Workshop) with drag-and-drop task management
- Cron job scheduling with heartbeat monitoring
- Token usage and cost tracking with charts
- Document ingestion workspace (Docu Digest)
- Live conversation feed
- Gateway management with live connection testing
- Dark mode + light mode

## Prerequisites

- Node.js 22+
- A running [OpenClaw](https://openclaw.ai) gateway
- A [Turso](https://turso.tech) database (required for persistent storage on Vercel; SQLite works locally)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/jackzkidder/openclaw-control.git
cd openclaw-control

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — see Configuration section below

# 3. Install dependencies
npm install

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first load you'll see the Dashboard.

## Connecting to Your OpenClaw Gateway

OpenClaw Control connects to your gateway over WebSocket. The connection runs **server-side** — your API key never touches the browser.

1. Start your OpenClaw gateway:
   ```bash
   openclaw gateway
   # Default port: 8765
   ```

2. In OpenClaw Control, go to **Settings** and enter:
   - **Gateway URL** — `ws://127.0.0.1:8765` (must include port, must start with `ws://` or `wss://`)
   - **API Key** — your gateway auth token

3. Click **Test Connection** — all three checks (Gateway, WebSocket, Webhook) should go green.

See [GATEWAY_SETUP.md](./GATEWAY_SETUP.md) for remote and multi-machine setups.

## Configuration

Copy `.env.example` to `.env.local` and edit:

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | Yes (Vercel) | Turso database URL — `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Yes (Vercel) | Turso auth token |
| `GATEWAY_URL` | Optional | Pre-configure the gateway WebSocket URL |
| `GATEWAY_API_KEY` | Optional | Pre-configure the gateway API key |

You can also configure the gateway URL and API key directly in the **Settings** page — no restart required.

**Local development:** The app falls back to a local SQLite database at `./data/mission-control.db` when Turso env vars are not set.

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel project settings:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. Deploy

The app is a standard Next.js 14 App Router project — no custom build steps required.

## Architecture

```
OpenClaw Gateway (WebSocket)
        │
        ▼
lib/openclaw/connectionManager.ts   ← server singleton, never exposed to browser
        │
        ▼
lib/openclaw/eventBus.ts            ← Node EventEmitter
        │
        ▼
/api/openclaw/events                ← Server-Sent Events stream
        │
        ▼
hooks/useGatewayEvents.ts           ← browser EventSource → Zustand store
        │
        ▼
React components                    ← real-time UI
```

**Key decisions:**
- WebSocket to OpenClaw runs **server-side only** — API key stays on the server
- SQLite/Turso stores only app metadata (tasks, cron jobs, documents) — not OpenClaw runtime state
- SSE fans out gateway events to all connected browser tabs
- TanStack Query handles REST data; Zustand handles live/ephemeral state

## Pages

| Page | Path | Description |
|---|---|---|
| Dashboard | `/` | Live metrics — agents, tasks, gateway health, activity feed |
| Workshop | `/workshop` | Kanban board with drag-and-drop task planning |
| Agents | `/agents` | Agent roster with live status and token usage |
| Automation | `/automation` | Cron jobs + heartbeat monitor |
| Usage & Cost | `/usage` | Token consumption and spending charts |
| Docu Digest | `/docu-digest` | Document upload and ingestion workspace |
| Conversations | `/conversations` | Live agent communication feed |
| Settings | `/settings` | Gateway connection, webhook, and appearance config |

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — design system with light + dark mode
- **Framer Motion** — animations
- **Recharts** — usage/cost charts
- **Zustand** + **TanStack Query** — state management
- **better-sqlite3** / **Turso libsql** — storage
- **ws** — server-side WebSocket client
- **@dnd-kit** — Kanban drag and drop

## License

MIT
