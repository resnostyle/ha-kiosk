# Security

## Secrets and git

- **Never commit** `.env` or `src/lib/config/entities.json`.
- Use `.env.example` and `entities.example.json` as templates only.
- For CI, store `HA_URL`, `HA_TOKEN`, and `ENTITIES_JSON` as GitHub Actions secrets.

## Home Assistant token in the browser

This app is a **client-only SPA**. `VITE_HA_URL` and `VITE_HA_TOKEN` are embedded in the JavaScript bundle at build time. Anyone who can open the kiosk URL (or inspect a Docker image built with your token) can extract and reuse that token.

Mitigations:

1. Create a **dedicated HA user** for kiosk displays with the minimum permissions needed.
2. Restrict network access (LAN, VPN, or ingress auth) so the bundle is not world-readable.
3. **Do not publish** Docker images to a public registry if they were built with a real token.
4. Rotate the token if you suspect it was exposed.

## Camera streams

Camera proxy URLs include the same long-lived token. Treat kiosk devices as trusted for your HA instance.
