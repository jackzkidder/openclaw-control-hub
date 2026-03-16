# Gateway Setup

OpenClaw Control connects to an OpenClaw gateway over WebSocket. The connection is server-side — your API key never reaches the browser.

## Local Gateway (same machine)

1. Start your OpenClaw gateway:
   ```bash
   openclaw gateway
   # Listens on ws://127.0.0.1:8765 by default
   ```

2. Open OpenClaw Control at `http://localhost:3000` → **Settings**.

3. Enter:
   - **Gateway URL:** `ws://127.0.0.1:8765`
   - **API Key:** your gateway auth token

4. Click **Test Connection** — all three checks should go green.

## Remote Gateway (different machine or server)

If the gateway runs on a remote host, expose the WebSocket port and use the public address:

```
wss://gateway.example.com        # TLS (recommended)
ws://192.168.1.50:8765            # LAN (no TLS)
```

> **Tip:** Put the gateway behind a reverse proxy (nginx, Caddy) that terminates TLS and forwards WebSocket traffic to `ws://127.0.0.1:8765`.

### nginx example

```nginx
server {
    listen 443 ssl;
    server_name gateway.example.com;

    ssl_certificate     /etc/letsencrypt/live/gateway.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gateway.example.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_read_timeout 3600s;
    }
}
```

### Caddy example

```caddy
gateway.example.com {
    reverse_proxy localhost:8765
}
```

Caddy handles TLS automatically via Let's Encrypt.

## Pre-configuring via Environment Variables

Instead of entering the gateway URL and API key in the Settings page, you can pre-configure them in `.env.local`:

```bash
GATEWAY_URL=wss://gateway.example.com
GATEWAY_API_KEY=your-api-key
```

Settings-page values override environment variables at runtime.

## Deploying on Vercel

When OpenClaw Control runs on Vercel and the gateway is elsewhere:

1. Set `GATEWAY_URL` and `GATEWAY_API_KEY` in the Vercel project environment variables.
2. Make sure the gateway's WebSocket port is publicly reachable (or use the nginx/Caddy proxy above).
3. Use `wss://` (TLS) — Vercel's edge network requires secure WebSocket connections for production deployments.

## Connection Health Check

The Settings page **Test Connection** button runs three checks:

| Check | What it tests |
|---|---|
| Gateway | HTTP reachability of the gateway host |
| WebSocket | Full WebSocket handshake and auth |
| Webhook | Inbound webhook endpoint on OpenClaw Control |

All three should show green before starting work. If WebSocket fails but Gateway passes, check that the port is open and the proxy is forwarding `Upgrade` headers correctly.

## Troubleshooting

**`ECONNREFUSED` / Gateway check fails**
- Gateway is not running, or the host/port is wrong.
- Confirm with: `curl http://127.0.0.1:8765/health` (or the gateway's health endpoint).

**WebSocket check fails, Gateway passes**
- Proxy is not forwarding `Connection: upgrade` / `Upgrade: websocket` headers.
- See the nginx/Caddy examples above.

**`401 Unauthorized` on WebSocket**
- API key is incorrect. Re-check the key in Settings.

**Works locally, fails on Vercel**
- Verify `GATEWAY_URL` starts with `wss://` (not `ws://`).
- Confirm the gateway host allows inbound connections from Vercel's IP ranges.
