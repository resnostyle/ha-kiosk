import {
  subscribeEntities,
  type HassEntities,
  type HassEntity,
} from 'home-assistant-js-websocket'
import { getConnection, resetConnection } from './connection'
import type { ConnectionStatus } from './utils'

type Listener = () => void

function createEntityStore() {
  let entities: HassEntities = {}
  let status: ConnectionStatus = 'connecting'
  let errorMessage: string | null = null
  const listeners = new Set<Listener>()
  let unsubscribe: (() => void) | null = null
  let started = false

  function notify() {
    for (const listener of listeners) {
      listener()
    }
  }

  async function start() {
    if (started) return
    started = true
    status = 'connecting'
    notify()

    try {
      const conn = await getConnection()
      status = 'connected'
      errorMessage = null
      notify()

      conn.addEventListener('disconnected', () => {
        status = 'reconnecting'
        notify()
      })

      conn.addEventListener('ready', () => {
        status = 'connected'
        errorMessage = null
        notify()
      })

      unsubscribe = subscribeEntities(conn, (next) => {
        entities = next
        notify()
      })
    } catch (err) {
      status = 'error'
      errorMessage = err instanceof Error ? err.message : String(err)
      resetConnection()
      started = false
      notify()
      window.setTimeout(() => void start(), 5000)
    }
  }

  return {
    subscribe(listener: Listener) {
      listeners.add(listener)
      void start()
      return () => listeners.delete(listener)
    },
    getStatus(): ConnectionStatus {
      return status
    },
    getError(): string | null {
      return errorMessage
    },
    getEntity(entityId: string): HassEntity | undefined {
      return entities[entityId]
    },
    getEntities(): HassEntities {
      return entities
    },
  }
}

export const entityStore = createEntityStore()
