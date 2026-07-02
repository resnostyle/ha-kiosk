import type { HassEntity } from 'home-assistant-js-websocket'

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error'

export function isEntityAvailable(entity: HassEntity | undefined): boolean {
  if (!entity) return false
  return entity.state !== 'unavailable' && entity.state !== 'unknown'
}

export function friendlyName(entity: HassEntity | undefined, fallback: string): string {
  const name = entity?.attributes?.friendly_name
  return typeof name === 'string' && name.length > 0 ? name : fallback
}

export function formatTemperature(entity: HassEntity | undefined): string {
  if (!entity || !isEntityAvailable(entity)) return '—'
  const unit = entity.attributes.unit_of_measurement ?? '°'
  return `${entity.state}${unit}`
}

export function personIsHome(entity: HassEntity | undefined): boolean {
  return entity?.state === 'home'
}

export function isOn(entity: HassEntity | undefined): boolean {
  return entity?.state === 'on'
}

export function weatherCondition(entity: HassEntity | undefined): string {
  if (!entity || !isEntityAvailable(entity)) return 'Unavailable'
  const condition = entity.state
  return condition.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function forecastDays(entity: HassEntity | undefined, limit = 5) {
  const forecast = entity?.attributes?.forecast
  if (!Array.isArray(forecast)) return []
  return forecast.slice(0, limit) as Array<{
    datetime?: string
    temperature?: number
    templow?: number
    condition?: string
  }>
}

export function haUrl(): string {
  const url = import.meta.env.VITE_HA_URL
  if (!url) throw new Error('VITE_HA_URL is not configured')
  return url.replace(/\/$/, '')
}

export function haToken(): string {
  const token = import.meta.env.VITE_HA_TOKEN
  if (!token) throw new Error('VITE_HA_TOKEN is not configured')
  return token
}

export function cameraStreamUrl(entityId: string): string {
  return `${haUrl()}/api/camera_proxy_stream/${entityId}?token=${haToken()}`
}

export function cameraSnapshotUrl(entityId: string): string {
  return `${haUrl()}/api/camera_proxy/${entityId}?token=${haToken()}`
}
