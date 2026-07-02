import entities from './entities.json'
import type { HassEntity } from 'home-assistant-js-websocket'
import { formatAlertLabel, friendlyName } from '../ha/utils'

export interface EntityLabels {
  people: Record<string, string>
  lights: Record<string, string>
  masterBedroomCovers: Record<string, string>
  aqaraPresence?: Record<string, string>
}

export interface MasterBedroomConfig {
  light: string
  automationWhenOn: string
  automationWhenOff: string
  doors: string[]
  covers: Record<string, string>
}

export interface FlightMapCenter {
  latitude: number
  longitude: number
  zoom?: number
  label?: string
  /** Default view radius when no aircraft are plotted (miles). */
  radiusMiles?: number
}

export interface FlightTrackerConfig {
  airportTrack: string
  currentInArea: string
  airportArrivals: string
  airportDepartures: string
  arrivalsDelayed: string
  departuresDelayed: string
  arrivalsDelayAverage: string
  departuresDelayAverage: string
  enteredArea?: string
  exitedArea?: string
  mapCenter?: FlightMapCenter
}

export interface EntityConfig {
  weather: string
  people: string[]
  lights: Record<string, string>
  presence: Record<string, string>
  aqaraPresenceZones: string[]
  cameras: Record<string, string>
  cameraOccupancy: Record<string, string>
  status: Record<string, string>
  masterBedroom: MasterBedroomConfig
  flightTracker: FlightTrackerConfig
  labels: EntityLabels
}

export const entityConfig: EntityConfig = entities

/** Collect every HA entity_id referenced in config. */
export function allEntityIds(config: EntityConfig = entityConfig): string[] {
  const ids = new Set<string>([
    config.weather,
    ...config.people,
    ...Object.values(config.lights),
    ...Object.values(config.presence),
    ...config.aqaraPresenceZones,
    ...Object.values(config.cameras),
    ...Object.values(config.cameraOccupancy),
    ...Object.values(config.status),
    config.masterBedroom.light,
    config.masterBedroom.automationWhenOn,
    config.masterBedroom.automationWhenOff,
    ...config.masterBedroom.doors,
    ...Object.values(config.masterBedroom.covers),
    config.flightTracker.airportTrack,
    config.flightTracker.currentInArea,
    config.flightTracker.airportArrivals,
    config.flightTracker.airportDepartures,
    config.flightTracker.arrivalsDelayed,
    config.flightTracker.departuresDelayed,
    config.flightTracker.arrivalsDelayAverage,
    config.flightTracker.departuresDelayAverage,
    ...(config.flightTracker.enteredArea ? [config.flightTracker.enteredArea] : []),
    ...(config.flightTracker.exitedArea ? [config.flightTracker.exitedArea] : []),
  ])
  return [...ids]
}

export function getLightId(key: keyof EntityConfig['lights']): string {
  return entityConfig.lights[key]
}

export function getPresenceId(key: keyof EntityConfig['presence']): string {
  return entityConfig.presence[key]
}

export function getCameraId(key: keyof EntityConfig['cameras']): string {
  return entityConfig.cameras[key]
}

export function getStatusId(key: keyof EntityConfig['status']): string {
  return entityConfig.status[key]
}

export function personLabel(entityId: string): string {
  return entityConfig.labels.people[entityId] ?? entityId
}

export function lightLabel(key: string): string {
  return entityConfig.labels.lights[key] ?? key
}

export function masterBedroomCoverLabel(key: string): string {
  return entityConfig.labels.masterBedroomCovers[key] ?? key
}

export function aqaraPresenceLabel(
  entityId: string,
  entity?: HassEntity,
): string {
  const configured = entityConfig.labels.aqaraPresence?.[entityId]
  if (configured) return configured
  return formatAlertLabel(friendlyName(entity, 'Zone'), 'presence')
}
