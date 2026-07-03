# Security

## Public repository checklist

Before making this repo public:

1. **Never commit** `.env` or `src/lib/config/entities.json` — they hold your token and home layout.
2. Use `.env.example` and `entities.example.json` as templates only.
3. Store real values in **GitHub Actions secrets** (`HA_URL`, `HA_TOKEN`, `ENTITIES_JSON`, `KUBECONFIG`).
4. If `entities.json` was ever committed, **rewrite git history** before publishing (see below).
5. Set the **GHCR package to private** if CI builds with a real `HA_TOKEN` (the token is baked into the JS bundle inside the image).

## Secrets and git

- `.env` and `src/lib/config/entities.json` are gitignored.
- CI writes `entities.json` at build time from the `ENTITIES_JSON` secret, or falls back to the anonymized example file.
- Fork PRs do not receive repository secrets; CI builds with placeholder credentials in that case.

### Scrubbing history

If real entity IDs or names were committed in an earlier revision, they remain in git history until removed. Tools like [git-filter-repo](https://github.com/newren/git-filter-repo) or BFG can purge `src/lib/config/entities.json` from all commits, followed by a force-push. Rotate nothing token-wise unless a token was actually exposed.

## Home Assistant token in the browser

This app is a **client-only SPA**. `VITE_HA_URL` and `VITE_HA_TOKEN` are embedded in the JavaScript bundle at build time. Anyone who can open the kiosk URL (or inspect a Docker image built with your token) can extract and reuse that token.

Mitigations:

1. Create a **dedicated HA user** for kiosk displays with the minimum permissions needed.
2. Restrict network access (LAN, VPN, or ingress auth) so the bundle is not world-readable.
3. Keep **GHCR images private** when built with a real token, or build locally and never push token-bearing images.
4. Rotate the token if you suspect it was exposed.

## Camera streams

Camera proxy URLs include the same long-lived token. Treat kiosk devices as trusted for your HA instance.
