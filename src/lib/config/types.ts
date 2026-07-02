import entities from './entities.json'

export interface EntityConfig {
  weather: string
  people: string[]
  lights: Record<string, string>
  presence: Record<string, string>
  cameras: Record<string, string>
  cameraOccupancy: Record<string, string>
  status: Record<string, string>
}

export const entityConfig: EntityConfig = entities

/** Collect every HA entity_id referenced in config. */
export function allEntityIds(config: EntityConfig = entityConfig): string[] {
  const ids = new Set<string>([
    config.weather,
    ...config.people,
    ...Object.values(config.lights),
    ...Object.values(config.presence),
    ...Object.values(config.cameras),
    ...Object.values(config.cameraOccupancy),
    ...Object.values(config.status),
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

export const LIGHT_LABELS: Record<keyof EntityConfig['lights'], string> = {
  deskOne: "Desk One",
  deskTwo: "Desk Two",
  livingRoom: 'Living Room',
  loft: 'Loft',
}

export const PERSON_LABELS: Record<string, string> = {
  'person.adult_one': 'Adult One',
  'person.adult_two': 'Adult Two',
  'person.child_one': 'Child One',
  'person.child_two': 'Child Two',
}
