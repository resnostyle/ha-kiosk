import {
  createConnection,
  createLongLivedTokenAuth,
  type Connection,
} from 'home-assistant-js-websocket'
import { haToken, haUrl } from './utils'

let connectionPromise: Promise<Connection> | null = null

export function getConnection(): Promise<Connection> {
  if (!connectionPromise) {
    connectionPromise = createConnection({
      auth: createLongLivedTokenAuth(haUrl(), haToken()),
      setupRetry: -1,
    })
  }
  return connectionPromise
}

export function resetConnection(): void {
  connectionPromise = null
}
