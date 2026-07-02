import type { HassEntity } from 'home-assistant-js-websocket'
import { isEntityAvailable } from '../ha/utils'
import type { BoardAirlineCount, BoardFlight, BoardKind, FlightStatTone, OverheadAirportRole, OverheadDelayInfo, OverheadFlight } from './types'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function sanitizePhotoUrl(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null
  return raw.replace(/^https:+(https?:\/\/)/, '$1')
}

/** Kiwi CDN — common IATA airline logos; returns null when code is missing/invalid. */
export function airlineLogoUrl(iata: string | null | undefined): string | null {
  const code = iata?.trim().toUpperCase()
  if (!code || !/^[A-Z0-9]{2,3}$/.test(code)) return null
  return `https://images.kiwi.com/airlines/64/${code}.png`
}

function asUnixTime(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function parseOverheadFlights(entity: HassEntity | undefined): OverheadFlight[] {
  const flights = entity?.attributes?.flights
  if (!Array.isArray(flights)) return []

  return flights.flatMap((item) => {
    const row = asRecord(item)
    if (!row) return []

    const id = asString(row.id) ?? asString(row.aircraft_icao_24bit) ?? asString(row.callsign)
    if (!id) return []

    return [
      {
        id,
        callsign: asString(row.callsign) ?? asString(row.flight_number) ?? id,
        flightNumber: asString(row.flight_number),
        airline: asString(row.airline_short) ?? asString(row.airline) ?? 'Unknown',
        airlineIata: asString(row.airline_iata)?.toUpperCase() ?? null,
        aircraftModel: asString(row.aircraft_model) ?? asString(row.aircraft_code) ?? '',
        registration: asString(row.aircraft_registration) ?? '',
        originCode: asString(row.airport_origin_code_iata),
        originCity: asString(row.airport_origin_city),
        destinationCode: asString(row.airport_destination_code_iata),
        destinationCity: asString(row.airport_destination_city),
        originTerminal: asString(row.airport_origin_terminal),
        destinationTerminal: asString(row.airport_destination_terminal),
        realArrivalUnix: asUnixTime(row.time_real_arrival),
        realDepartureUnix: asUnixTime(row.time_real_departure),
        scheduledArrivalUnix: asUnixTime(row.time_scheduled_arrival),
        scheduledDepartureUnix: asUnixTime(row.time_scheduled_departure),
        estimatedArrivalUnix: asUnixTime(row.time_estimated_arrival),
        estimatedDepartureUnix: asUnixTime(row.time_estimated_departure),
        altitude: asNumber(row.altitude),
        groundSpeed: asNumber(row.ground_speed),
        heading: asNumber(row.heading),
        distance: asNumber(row.distance),
        verticalSpeed: asNumber(row.vertical_speed),
        latitude: asNumber(row.latitude),
        longitude: asNumber(row.longitude),
        onGround: Number(row.on_ground) === 1 || row.on_ground === true,
        tracked: row.tracked_by_device != null && row.tracked_by_device !== false && row.tracked_by_device !== '',
        photoUrl:
          sanitizePhotoUrl(row.aircraft_photo_medium) ??
          sanitizePhotoUrl(row.aircraft_photo_small) ??
          sanitizePhotoUrl(row.aircraft_photo_large),
      },
    ]
  })
}

export function parseBoardFlights(
  entity: HassEntity | undefined,
  options: { hideLanded?: boolean; limit?: number | null } = {},
): BoardFlight[] {
  const { hideLanded = true, limit = 18 } = options
  const flights = entity?.attributes?.flights
  if (!Array.isArray(flights)) return []

  const parsed: BoardFlight[] = []

  for (const item of flights) {
    const row = asRecord(item)
    if (!row) continue

    const status = asString(row.status) ?? 'unknown'
    if (hideLanded && status === 'landed') continue

    const flightNumber = asString(row.flight_number) ?? asString(row.callsign) ?? '—'
    const id = asString(row.flight_id) ?? flightNumber

    parsed.push({
      id,
      flightNumber,
      airline: asString(row.airline_short) ?? asString(row.airline) ?? 'Unknown',
      airlineIata: asString(row.airline_iata)?.toUpperCase() ?? null,
      airport: asString(row.airport_city) ?? asString(row.airport_name) ?? '—',
      airportCode: asString(row.airport_code_iata) ?? '—',
      status,
      statusText: asString(row.status_text) ?? status,
      aircraftModel: asString(row.aircraft_model) ?? asString(row.aircraft_code) ?? '',
      scheduledArrivalUnix: asUnixTime(row.time_scheduled_arrival),
      scheduledDepartureUnix: asUnixTime(row.time_scheduled_departure),
      realArrivalUnix: asUnixTime(row.time_real_arrival),
      realDepartureUnix: asUnixTime(row.time_real_departure),
      estimatedArrivalUnix: asUnixTime(row.time_estimated_arrival),
      estimatedDepartureUnix: asUnixTime(row.time_estimated_departure),
    })

    if (limit != null && parsed.length >= limit) break
  }

  return parsed
}

export function countBoardFlightsByAirline(flights: BoardFlight[]): BoardAirlineCount[] {
  const counts = new Map<string, BoardAirlineCount>()

  for (const flight of flights) {
    const key = flight.airlineIata ?? flight.airline.trim().toLowerCase()
    const existing = counts.get(key)
    if (existing) {
      existing.count += 1
      continue
    }

    counts.set(key, {
      key,
      airline: flight.airline,
      airlineIata: flight.airlineIata,
      count: 1,
    })
  }

  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.airline.localeCompare(b.airline),
  )
}

export function sensorCount(entity: HassEntity | undefined): number | null {
  if (!isEntityAvailable(entity)) return null
  const n = Number(entity?.state)
  return Number.isFinite(n) ? n : null
}

export type { FlightStatTone } from './types'

export function statDisplayValue(count: number | null): string | number {
  return count ?? '—'
}

export function delayCountTone(count: number | null): FlightStatTone {
  if (count === null) return 'neutral'
  if (count === 0) return 'good'
  if (count <= 2) return 'warn'
  return 'danger'
}

export function delayMinutesTone(minutes: number | null): FlightStatTone {
  if (minutes === null) return 'neutral'
  if (minutes === 0) return 'good'
  if (minutes <= 15) return 'warn'
  return 'danger'
}

export function overheadTone(count: number): FlightStatTone {
  return count > 0 ? 'accent' : 'neutral'
}

export function statusClass(status: string): string {
  switch (status) {
    case 'delayed':
      return 'flight-status-delayed'
    case 'estimated':
      return 'flight-status-estimated'
    case 'scheduled':
      return 'flight-status-scheduled'
    case 'landed':
      return 'flight-status-landed'
    default:
      return 'flight-status-default'
  }
}

export function routeLabel(flight: OverheadFlight): string {
  const from = flight.originCode ?? flight.originCity ?? '?'
  const to = flight.destinationCode ?? flight.destinationCity ?? '—'
  return `${from} → ${to}`
}

function normalizeAirportCode(code: string | null | undefined): string | null {
  const normalized = code?.trim().toUpperCase()
  if (!normalized || normalized === '—' || normalized.length < 3) return null
  return normalized
}

/** Whether an overhead aircraft is arriving at or departing from the tracked airport. */
export function overheadAirportRole(
  flight: OverheadFlight,
  airportCode: string | null | undefined,
): OverheadAirportRole | null {
  const hub = normalizeAirportCode(airportCode)
  if (!hub) return null

  const origin = normalizeAirportCode(flight.originCode)
  const destination = normalizeAirportCode(flight.destinationCode)

  if (destination === hub) return 'arrival'
  if (origin === hub) return 'departure'
  return null
}

export function overheadAirportRoleLabel(
  role: OverheadAirportRole,
  airportCode: string | null | undefined,
): string {
  const hub = normalizeAirportCode(airportCode) ?? 'airport'
  return role === 'arrival' ? `Arriving ${hub}` : `Departing ${hub}`
}

export function overheadAirportRoleShortLabel(
  role: OverheadAirportRole,
  airportCode: string | null | undefined,
): string {
  const hub = normalizeAirportCode(airportCode) ?? '—'
  return role === 'arrival' ? `↓ ${hub}` : `↑ ${hub}`
}

const flightClockFmt = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

function formatTerminalLabel(terminal: string | null): string | null {
  if (!terminal) return null
  const trimmed = terminal.trim()
  if (!trimmed) return null
  return /^terminal\b/i.test(trimmed) ? trimmed : `Terminal ${trimmed}`
}

export function formatFlightClock(unixSeconds: number | null): string | null {
  if (unixSeconds == null) return null
  return flightClockFmt.format(new Date(unixSeconds * 1000))
}

const ON_TIME_THRESHOLD_MIN = 5
const VERTICAL_SPEED_MIN_FPM = 50

export function boardScheduledUnix(flight: BoardFlight, kind: BoardKind): number | null {
  return kind === 'arrival' ? flight.scheduledArrivalUnix : flight.scheduledDepartureUnix
}

export function boardActualUnix(flight: BoardFlight, kind: BoardKind): number | null {
  if (kind === 'arrival') {
    return flight.realArrivalUnix ?? flight.estimatedArrivalUnix
  }
  return flight.realDepartureUnix ?? flight.estimatedDepartureUnix
}

export function boardScheduledTime(flight: BoardFlight, kind: BoardKind): string | null {
  return formatFlightClock(boardScheduledUnix(flight, kind))
}

/** Estimated or actual time when it differs from scheduled. */
export function boardActualTime(flight: BoardFlight, kind: BoardKind): string | null {
  const scheduled = boardScheduledUnix(flight, kind)
  const actual = boardActualUnix(flight, kind)
  if (actual == null) return null

  const clock = formatFlightClock(actual)
  if (!clock) return null

  if (kind === 'arrival' && flight.realArrivalUnix) return clock
  if (kind === 'departure' && flight.realDepartureUnix) return clock

  if (scheduled != null && Math.abs(actual - scheduled) <= ON_TIME_THRESHOLD_MIN * 60) {
    return null
  }

  return clock
}

export function boardDelayInfo(
  flight: BoardFlight,
  kind: BoardKind,
): OverheadDelayInfo | null {
  const scheduled = boardScheduledUnix(flight, kind)
  const actual = boardActualUnix(flight, kind)
  if (scheduled == null || actual == null) return null

  const deltaMin = Math.round((actual - scheduled) / 60)
  const abs = Math.abs(deltaMin)

  if (abs <= ON_TIME_THRESHOLD_MIN) {
    return null
  }

  if (deltaMin > 0) {
    return { label: `+${deltaMin} min`, tone: delayMinutesTone(deltaMin) }
  }

  return { label: `${deltaMin} min`, tone: 'good' }
}

export function boardStatusDisplay(flight: BoardFlight, kind: BoardKind): string {
  const hasStructuredTimes =
    boardScheduledUnix(flight, kind) != null || boardActualUnix(flight, kind) != null
  if (!hasStructuredTimes) return flight.statusText

  switch (flight.status) {
    case 'delayed':
      return 'Delayed'
    case 'estimated':
      return 'Estimated'
    case 'scheduled':
      return 'Scheduled'
    default:
      return flight.statusText
  }
}

/** Soonest scheduled time first; flights without a schedule sort to the end. */
export function sortBoardFlights(flights: BoardFlight[], kind: BoardKind): BoardFlight[] {
  return [...flights].sort((a, b) => {
    const ta = boardScheduledUnix(a, kind)
    const tb = boardScheduledUnix(b, kind)
    if (ta == null && tb == null) return 0
    if (ta == null) return 1
    if (tb == null) return -1
    return ta - tb
  })
}

export function flightStatToneToBadgeClass(tone: FlightStatTone): string {
  switch (tone) {
    case 'good':
      return 'badge badge--success'
    case 'warn':
      return 'badge badge--warn'
    case 'danger':
      return 'badge badge--danger'
    case 'accent':
      return 'badge badge--accent'
    default:
      return 'badge badge--muted'
  }
}

/** ETA, ETD, or departed time for flights arriving/departing the tracked airport. */
export function overheadScheduleLine(
  flight: OverheadFlight,
  airportCode: string | null | undefined,
): string | null {
  const role = overheadAirportRole(flight, airportCode)
  if (!role) return null

  if (role === 'arrival') {
    if (flight.realArrivalUnix) return null
    const eta = formatFlightClock(flight.estimatedArrivalUnix)
    return eta ? `ETA ${eta}` : null
  }

  const departed = formatFlightClock(flight.realDepartureUnix)
  if (departed) return `Departed ${departed}`

  const etd = formatFlightClock(flight.estimatedDepartureUnix)
  return etd ? `ETD ${etd}` : null
}

/** Delay vs scheduled time for hub arrivals/departures. */
export function overheadDelayInfo(
  flight: OverheadFlight,
  airportCode: string | null | undefined,
): OverheadDelayInfo | null {
  const role = overheadAirportRole(flight, airportCode)
  if (!role) return null

  const scheduled =
    role === 'arrival' ? flight.scheduledArrivalUnix : flight.scheduledDepartureUnix
  const actual =
    role === 'arrival'
      ? (flight.realArrivalUnix ?? flight.estimatedArrivalUnix)
      : (flight.realDepartureUnix ?? flight.estimatedDepartureUnix)

  if (scheduled == null || actual == null) return null

  const deltaMin = Math.round((actual - scheduled) / 60)
  const abs = Math.abs(deltaMin)

  if (abs <= ON_TIME_THRESHOLD_MIN) {
    return { label: 'On time', tone: 'good' }
  }

  if (deltaMin > 0) {
    return { label: `+${deltaMin} min`, tone: delayMinutesTone(deltaMin) }
  }

  return { label: `${deltaMin} min`, tone: 'good' }
}

/** Climb/descent rate when airborne and moving vertically. */
export function formatVerticalSpeed(flight: OverheadFlight): string | null {
  if (flight.onGround) return null

  const vs = Math.round(flight.verticalSpeed)
  if (Math.abs(vs) < VERTICAL_SPEED_MIN_FPM) return null

  const arrow = vs > 0 ? '↑' : '↓'
  return `${arrow} ${Math.abs(vs).toLocaleString()} fpm`
}

/** Extra context when an aircraft is on the ground at the tracked airport (terminal, landed time, taxi). */
export function overheadGroundDetail(
  flight: OverheadFlight,
  airportCode: string | null | undefined,
): string | null {
  if (!flight.onGround) return null

  const role = overheadAirportRole(flight, airportCode)
  if (!role) return null

  const parts: string[] = []

  if (role === 'arrival') {
    const terminal = formatTerminalLabel(flight.destinationTerminal)
    if (terminal) parts.push(terminal)

    const landed = formatFlightClock(flight.realArrivalUnix)
    if (landed) parts.push(`Landed ${landed}`)
  } else {
    const terminal = formatTerminalLabel(flight.originTerminal)
    if (terminal) parts.push(terminal)

    const speed = Math.round(flight.groundSpeed)
    parts.push(speed > 0 ? `Taxiing ${speed} kt` : 'On ground')
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

/** Single-line altitude/speed/distance/heading, or ground detail when at the hub. */
export function overheadTelemetryLine(
  flight: OverheadFlight,
  airportCode: string | null | undefined,
): string {
  const groundDetail = overheadGroundDetail(flight, airportCode)
  const dist = `${flight.distance.toFixed(1)} mi`
  const hdg = `${Math.round(flight.heading)}°`

  if (groundDetail) return `${groundDetail} · ${dist} · ${hdg}`

  const alt = flight.onGround
    ? 'Ground'
    : `${Math.round(flight.altitude).toLocaleString()} ft`
  const speed = `${Math.round(flight.groundSpeed)} kt`
  return `${alt} · ${speed} · ${dist} · ${hdg}`
}

export interface FlightMarkerColors {
  airborne: string
  tracked: string
  ground: string
  arrival: string
  departure: string
  accent: string
}

export function readFlightMarkerColors(): FlightMarkerColors {
  const fallback: FlightMarkerColors = {
    airborne: '#4ade80',
    tracked: '#5eb8ff',
    ground: '#94a3b8',
    arrival: '#4ade80',
    departure: '#fbbf24',
    accent: '#5eb8ff',
  }
  if (typeof document === 'undefined') return fallback

  const style = getComputedStyle(document.documentElement)
  const read = (name: string, fb: string) => style.getPropertyValue(name).trim() || fb

  return {
    airborne: read('--color-success', fallback.airborne),
    tracked: read('--color-accent', fallback.tracked),
    ground: read('--color-marker-ground', fallback.ground),
    arrival: read('--color-success', fallback.arrival),
    departure: read('--color-warning', fallback.departure),
    accent: read('--color-accent', fallback.accent),
  }
}

function overheadAirportSortRank(
  flight: OverheadFlight,
  airportCode: string | null | undefined,
): number {
  const role = overheadAirportRole(flight, airportCode)
  if (role === 'arrival') return 0
  if (role === 'departure') return 1
  return 2
}

/** RDU (tracked airport) arrivals first, then departures, then others; closer aircraft first within each group. */
export function sortOverheadByAirportRole(
  flights: OverheadFlight[],
  airportCode: string | null | undefined,
): OverheadFlight[] {
  return flights
    .map((flight, index) => ({ flight, index }))
    .sort((a, b) => {
      const rankDiff =
        overheadAirportSortRank(a.flight, airportCode) -
        overheadAirportSortRank(b.flight, airportCode)
      if (rankDiff !== 0) return rankDiff

      const distDiff = a.flight.distance - b.flight.distance
      if (distDiff !== 0) return distDiff

      return a.index - b.index
    })
    .map(({ flight }) => flight)
}

export function hasMapPosition(flight: OverheadFlight): boolean {
  return (
    Number.isFinite(flight.latitude) &&
    Number.isFinite(flight.longitude) &&
    !(flight.latitude === 0 && flight.longitude === 0)
  )
}

const EARTH_RADIUS_MILES = 3958.8

export function distanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a))
}

export interface RadarMapView {
  latitude: number
  longitude: number
  zoom: number
  radiusMiles: number
}

/** Pick a tight radar-style view around clustered local traffic. */
export function computeRadarView(
  flights: OverheadFlight[],
  center: { latitude: number; longitude: number; zoom?: number; radiusMiles?: number },
  mapSize: { width: number; height: number },
): RadarMapView {
  const positioned = flights.filter(hasMapPosition)
  const fallbackRadius = center.radiusMiles ?? 8

  if (positioned.length === 0) {
    return {
      latitude: center.latitude,
      longitude: center.longitude,
      radiusMiles: fallbackRadius,
      zoom: zoomForRadiusMiles(fallbackRadius, center.latitude, mapSize),
    }
  }

  const latitude =
    positioned.reduce((sum, flight) => sum + flight.latitude, center.latitude) /
    (positioned.length + 1)
  const longitude =
    positioned.reduce((sum, flight) => sum + flight.longitude, center.longitude) /
    (positioned.length + 1)

  const distances = positioned.map((flight) =>
    distanceMiles(latitude, longitude, flight.latitude, flight.longitude),
  )
  distances.push(distanceMiles(latitude, longitude, center.latitude, center.longitude))

  const spanMiles = Math.max(...distances, 2)
  const radiusMiles = clamp(spanMiles * 1.35 + 1.5, 4, 18)

  return {
    latitude,
    longitude,
    radiusMiles,
    zoom: zoomForRadiusMiles(radiusMiles, latitude, mapSize),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function zoomForRadiusMiles(
  radiusMiles: number,
  latitude: number,
  mapSize: { width: number; height: number },
): number {
  const radiusMeters = radiusMiles * 1609.344
  const usablePx = Math.max(Math.min(mapSize.width, mapSize.height) - 48, 120)
  const metersPerPixel = radiusMeters / (usablePx / 2)
  const latRad = (latitude * Math.PI) / 180
  const worldMetersPerPixel = 156543.03392 * Math.cos(latRad)
  const zoom = Math.log2(worldMetersPerPixel / metersPerPixel)
  if (!Number.isFinite(zoom)) return 12
  return clamp(Math.round(zoom * 10) / 10, 10.5, 15)
}
