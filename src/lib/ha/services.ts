import { callService } from 'home-assistant-js-websocket'
import { getConnection } from './connection'

export async function toggleLight(entityId: string): Promise<void> {
  const conn = await getConnection()
  await callService(conn, 'light', 'toggle', { entity_id: entityId })
}

export async function turnOnScene(entityId: string): Promise<void> {
  const conn = await getConnection()
  await callService(conn, 'scene', 'turn_on', { entity_id: entityId })
}
