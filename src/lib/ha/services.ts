import { callService } from 'home-assistant-js-websocket'
import { getConnection } from './connection'
import type { WeatherForecastDay } from './utils'
import { haToken, haUrl } from './utils'

export interface CalendarEvent {
  summary: string
  start: string
  end?: string
  allDay?: boolean
}

export interface TodoItem {
  summary: string
  uid?: string
  status?: string
}

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

function calendarEntityPath(entityId: string): string {
  return encodeURIComponent(entityId)
}

export async function getCalendarEvents(
  entityId: string,
  start: Date,
  end: Date,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  })
  const res = await fetch(
    `${haUrl()}/api/calendars/${calendarEntityPath(entityId)}?${params}`,
    {
      headers: { Authorization: `Bearer ${haToken()}` },
      cache: 'no-store',
    },
  )
  if (!res.ok) return []

  const raw = (await res.json()) as Array<{
    summary?: string
    start?: { date?: string; dateTime?: string }
    end?: { date?: string; dateTime?: string }
  }>

  return raw.flatMap((event) => {
    const startValue = event.start?.dateTime ?? event.start?.date
    if (!startValue || !event.summary) return []
    const endValue = event.end?.dateTime ?? event.end?.date
    return [
      {
        summary: event.summary,
        start: startValue,
        end: endValue,
        allDay: Boolean(event.start?.date && !event.start?.dateTime),
      },
    ]
  })
}

export async function getTodoItems(
  entityId: string,
  status: 'needs_action' | 'completed' = 'needs_action',
): Promise<TodoItem[]> {
  const res = await fetch(`${haUrl()}/api/services/todo/get_items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${haToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entity_id: entityId,
      status,
    }),
    cache: 'no-store',
  })
  if (!res.ok) return []

  const payload = (await res.json()) as {
    service_response?: Record<string, { items?: TodoItem[] }>
    [entityId: string]: { items?: TodoItem[] } | unknown
  }

  const bucket =
    (payload.service_response?.[entityId] as { items?: TodoItem[] } | undefined) ??
    (payload[entityId] as { items?: TodoItem[] } | undefined)

  return bucket?.items ?? []
}
