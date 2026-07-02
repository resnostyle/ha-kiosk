import { callService } from 'home-assistant-js-websocket'
import { getConnection } from './connection'
import type { WeatherForecastDay } from './utils'

export async function toggleLight(entityId: string): Promise<void> {
  const conn = await getConnection()
  await callService(conn, 'light', 'toggle', { entity_id: entityId })
}

export async function turnOnScene(entityId: string): Promise<void> {
  const conn = await getConnection()
  await callService(conn, 'scene', 'turn_on', { entity_id: entityId })
}

export async function triggerAutomation(entityId: string): Promise<void> {
  const conn = await getConnection()
  await callService(conn, 'automation', 'trigger', { entity_id: entityId })
}

function parseForecastResponse(
  response: unknown,
  entityId: string,
): WeatherForecastDay[] {
  if (!response || typeof response !== 'object') return []

  const root = response as Record<string, unknown>
  const buckets = [root.response, root.service_response, root]

  for (const bucket of buckets) {
    if (!bucket || typeof bucket !== 'object') continue
    const nested = (bucket as Record<string, unknown>)[entityId]
    if (!nested || typeof nested !== 'object') continue
    const forecast = (nested as { forecast?: unknown }).forecast
    if (Array.isArray(forecast)) return forecast as WeatherForecastDay[]
  }

  return []
}

export async function getDailyForecast(entityId: string): Promise<WeatherForecastDay[]> {
  const conn = await getConnection()
  const response = await callService(
    conn,
    'weather',
    'get_forecasts',
    { type: 'daily' },
    { entity_id: entityId },
    true,
  )
  return parseForecastResponse(response, entityId)
}
