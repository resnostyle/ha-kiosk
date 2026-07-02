import { getStates, type Connection, type HassEntities, type HassEntity } from 'home-assistant-js-websocket'
import { allEntityIds } from '../config/types'
import { fetchConfiguredEntities, restBootstrapEnabled } from './bootstrap'
import { getConnection, resetConnection } from './connection'
import type { ConnectionStatus } from './utils'

type Listener = () => void

interface StateChangedEvent {
  data: {
    entity_id: string
    new_state: HassEntity | null
  }
}

let entities = $state<HassEntities>({})
let status = $state<ConnectionStatus>('connecting')
let errorMessage = $state<string | null>(null)

const listeners = new Set<Listener>()
let unsubscribeEvents: (() => Promise<void>) | null = null
let started = false
let configuredIds = new Set<string>()
let socketReady = false
let bootstrapDone = false

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

function markReady() {
  bootstrapDone = true
  updateConnectionStatus()
  notify()
}

function updateConnectionStatus() {
  if (errorMessage) {
    status = 'error'
    return
  }
  if (socketReady && bootstrapDone) {
    status = 'connected'
    return
  }
  if (status !== 'reconnecting') {
    status = 'connecting'
  }
}

function mergeEntities(patch: HassEntities) {
  if (Object.keys(patch).length === 0) return
  entities = { ...entities, ...patch }
  notify()
}

function handleStateChanged(ev: StateChangedEvent) {
  const { entity_id, new_state } = ev.data
  if (!configuredIds.has(entity_id)) return

  if (new_state) {
    entities = { ...entities, [entity_id]: new_state }
  } else {
    const next = { ...entities }
    delete next[entity_id]
    entities = next
  }
  notify()
}

async function loadRestSnapshot() {
  configuredIds = new Set(allEntityIds())
  if (!restBootstrapEnabled()) return
  try {
    mergeEntities(await fetchConfiguredEntities([...configuredIds]))
  } catch {
    // REST failed; websocket fallback may still work.
  }
}

async function loadWebSocketSnapshot(conn: Connection) {
  if (!configuredIds.size) configuredIds = new Set(allEntityIds())
  try {
    const states = await getStates(conn)
    const snapshot: HassEntities = {}
    for (const state of states) {
      if (configuredIds.has(state.entity_id)) {
        snapshot[state.entity_id] = state
      }
    }
    mergeEntities(snapshot)
  } catch {
    // Keep whatever we already have.
  }
}

async function hydrate(conn: Connection) {
  await loadRestSnapshot()
  if (Object.keys(entities).length === 0) {
    await loadWebSocketSnapshot(conn)
  }
  markReady()
}

async function start() {
  if (started) return
  started = true
  status = 'connecting'
  errorMessage = null
  bootstrapDone = false
  notify()

  const restPromise = restBootstrapEnabled() ? loadRestSnapshot() : Promise.resolve()

  try {
    const conn = await getConnection()
    socketReady = true
    updateConnectionStatus()
    notify()

    await restPromise
    if (Object.keys(entities).length === 0) {
      await loadWebSocketSnapshot(conn)
    }
    markReady()

    conn.addEventListener('disconnected', () => {
      status = 'reconnecting'
      socketReady = false
      bootstrapDone = false
      notify()
    })

    conn.addEventListener('ready', () => {
      socketReady = true
      errorMessage = null
      status = 'reconnecting'
      bootstrapDone = false
      notify()
      void hydrate(conn)
    })

    unsubscribeEvents = await conn.subscribeEvents<StateChangedEvent>(
      handleStateChanged,
      'state_changed',
    )
  } catch (err) {
    status = 'error'
    errorMessage = err instanceof Error ? err.message : String(err)
    socketReady = false
    bootstrapDone = true
    resetConnection()
    started = false
    notify()
    window.setTimeout(() => void start(), 5000)
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  listener()
  void start()
  return () => listeners.delete(listener)
}

export const entityStore = {
  subscribe,
  ensureStarted() {
    void start()
  },
  get status() {
    return status
  },
  get error() {
    return errorMessage
  },
  getEntity(entityId: string): HassEntity | undefined {
    return entities[entityId]
  },
  entity(entityId: string): HassEntity | undefined {
    return entities[entityId]
  },
  getEntities(): HassEntities {
    return entities
  },
}
