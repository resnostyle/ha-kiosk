import type { HassEntities, HassEntity } from 'home-assistant-js-websocket'
import { allEntityIds } from '../config/types'
import { haToken, haUrl } from './utils'

const REST_CONCURRENCY = 10

let restBootstrapAllowed: boolean | null = null

/** REST /api/states only works same-origin unless HA CORS is configured. */
export function restBootstrapEnabled(): boolean {
  if (restBootstrapAllowed !== null) return restBootstrapAllowed
  if (typeof window === 'undefined') return false
  try {
    restBootstrapAllowed = new URL(haUrl()).origin === window.location.origin
  } catch {
    restBootstrapAllowed = false
  }
  return restBootstrapAllowed
}

async function fetchEntitySnapshot(entityId: string): Promise<HassEntity | null> {
  try {
    const res = await fetch(`${haUrl()}/api/states/${encodeURIComponent(entityId)}`, {
      headers: { Authorization: `Bearer ${haToken()}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as HassEntity
  } catch {
    return null
  }
}

/** Fast initial load: fetch only entities referenced in entities.json. */
export async function fetchConfiguredEntities(
  entityIds: string[] = allEntityIds(),
): Promise<HassEntities> {
  if (!restBootstrapEnabled()) return {}

  const entities: HassEntities = {}

  for (let i = 0; i < entityIds.length; i += REST_CONCURRENCY) {
    const batch = entityIds.slice(i, i + REST_CONCURRENCY)
    const results = await Promise.all(batch.map(fetchEntitySnapshot))
    for (const entity of results) {
      if (entity) entities[entity.entity_id] = entity
    }
  }

  return entities
}
