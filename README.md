# ha-kiosk

Custom wall tablet and TV display for Home Assistant. Client-only SPA served by nginx in Kubernetes; connects directly to HA on the LAN for real-time state.

## Routes

| URL hash | Surface |
|----------|---------|
| `#/kiosk` | Wall tablet glanceable dashboard |
| `#/tv` | Living room TV ambient display |
| `#/master-bedroom` | Master bedroom — Google Home / Nest Hub touch control |

## Quick start

Requires [mise](https://mise.jdx.dev/).

```bash
mise trust
cp .env.example .env          # set VITE_HA_URL and VITE_HA_TOKEN
mise run setup                # installs deps + creates entities.json if missing
# edit src/lib/config/entities.json with your HA entity IDs and display labels
mise run dev
```

Open http://localhost:5173/#/kiosk

## mise tasks

| Task | Description |
|------|-------------|
| `mise run setup` | Install npm dependencies and create local `entities.json` if needed |
| `mise run prepare-config` | Copy `entities.example.json` → `entities.json` when missing |
| `mise run dev` | Vite dev server |
| `mise run build` | Production build to `dist/` |
| `mise run check` | TypeScript + Svelte checks |
| `mise run validate-entities` | Verify `entities.json` against HA API |
| `mise run docker-build` | Build nginx container (requires `VITE_HA_TOKEN`) |
| `mise run docker-run` | Run container on port 8080 |
| `mise run urls` | Show local URLs |

## Configuration

### Entity map (local, not committed)

Copy [`src/lib/config/entities.example.json`](src/lib/config/entities.example.json) to `entities.json` (or run `mise run setup`). Edit with your entity IDs and display labels:

- `labels.people` — names shown on the TV/kiosk people row
- `labels.lights` — button labels on the kiosk light grid
- `labels.masterBedroomCovers` — cover alert names on the bedroom display

`entities.json` is gitignored so your home layout stays private.

### Environment variables

See [`.env.example`](.env.example):

- `VITE_HA_URL` — HA base URL (e.g. `http://homeassistant.local:8123` or your LAN IP)
- `VITE_HA_TOKEN` — long-lived access token for a **dedicated, limited** kiosk user

`.env` is gitignored. For Docker/K8s, these are baked in at **build time** via build args.

See [SECURITY.md](SECURITY.md) before publishing images or making the repo public.

## Deploy

```bash
export VITE_HA_URL=http://homeassistant.local:8123
export VITE_HA_TOKEN=your-token
export DOCKER_IMAGE=ghcr.io/your-org/ha-kiosk:latest   # optional
mise run docker-build
kubectl apply -f k8s/
```

Update `k8s/ingress.yaml` with your hostname.

### CI secrets (GitHub Actions)

| Secret | Purpose |
|--------|---------|
| `HA_URL` | Home Assistant URL for build + validate |
| `HA_TOKEN` | Long-lived token (keep repository private or use a limited user) |
| `ENTITIES_JSON` | Full contents of your `entities.json` for validate/build in CI |
| `KUBECONFIG` | Cluster credentials for deploy job |

### Device URLs

- Fully Kiosk: `http://<kiosk-host>/#/kiosk`
- Android TV: `http://<kiosk-host>/#/tv`
- Google Home / Nest Hub: `http://<kiosk-host>/#/master-bedroom`

### HA CORS

The SPA origin differs from HA. If WebSocket auth fails, add your kiosk URL to `http: cors_allowed_origins` in `configuration.yaml`.

## Architecture

- **Static SPA** — Svelte 5 + Vite + Tailwind
- **nginx container** in Kubernetes serves `dist/`
- **HA WebSocket** — `home-assistant-js-websocket` for state + service calls
- **Lovelace** — unchanged for admin/control surfaces
