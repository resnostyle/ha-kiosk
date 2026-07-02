# ha-kiosk

Custom wall tablet and TV display for Home Assistant. Client-only SPA served by nginx in Kubernetes; connects directly to HA on the LAN for real-time state.

## Routes

| URL hash | Surface |
|----------|---------|
| `#/kiosk` | Wall tablet glanceable dashboard |
| `#/tv` | Living room TV ambient display |

## Quick start

Requires [mise](https://mise.jdx.dev/).

```bash
mise trust
cp .env.example .env   # set VITE_HA_URL and VITE_HA_TOKEN
mise run setup
mise run dev
```

Open http://localhost:5173/#/kiosk

## mise tasks

| Task | Description |
|------|-------------|
| `mise run setup` | Install npm dependencies |
| `mise run dev` | Vite dev server |
| `mise run build` | Production build to `dist/` |
| `mise run check` | TypeScript + Svelte checks |
| `mise run validate-entities` | Verify `entities.json` against HA API |
| `mise run docker-build` | Build nginx container (requires `VITE_HA_TOKEN`) |
| `mise run docker-run` | Run container on port 8080 |
| `mise run urls` | Show local URLs |

## Configuration

Entity IDs live in [`src/lib/config/entities.json`](src/lib/config/entities.json) — components use logical keys, not raw entity IDs.

Environment variables (see [`.env.example`](.env.example)):

- `VITE_HA_URL` — HA base URL (e.g. `http://192.168.2.132:8123`)
- `VITE_HA_TOKEN` — long-lived access token (scoped kiosk user)

For Docker/K8s, these are baked in at **build time** via build args.

## Deploy

```bash
export VITE_HA_URL=http://192.168.2.132:8123
export VITE_HA_TOKEN=your-token
mise run docker-build
kubectl apply -f k8s/
```

Update `k8s/ingress.yaml` with your hostname.

### Device URLs

- Fully Kiosk: `http://<kiosk-host>/#/kiosk`
- Android TV: `http://<kiosk-host>/#/tv`

### HA CORS

The SPA origin differs from HA. If WebSocket auth fails, add your kiosk URL to `http: cors_allowed_origins` in `configuration.yaml`.

## Architecture

- **Static SPA** — Svelte 5 + Vite + Tailwind
- **nginx container** in Kubernetes serves `dist/`
- **HA WebSocket** — `home-assistant-js-websocket` for state + service calls
- **Lovelace** — unchanged for admin/control surfaces
