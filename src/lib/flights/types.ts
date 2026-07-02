export interface OverheadFlight {
  id: string
  callsign: string
  flightNumber: string | null
  airline: string
  airlineIata: string | null
  aircraftModel: string
  registration: string
  originCode: string | null
  originCity: string | null
  destinationCode: string | null
  destinationCity: string | null
  originTerminal: string | null
  destinationTerminal: string | null
  realArrivalUnix: number | null
  realDepartureUnix: number | null
  scheduledArrivalUnix: number | null
  scheduledDepartureUnix: number | null
  estimatedArrivalUnix: number | null
  estimatedDepartureUnix: number | null
  altitude: number
  groundSpeed: number
  heading: number
  distance: number
  verticalSpeed: number
  latitude: number
  longitude: number
  onGround: boolean
  tracked: boolean
  photoUrl: string | null
}

export interface BoardFlight {
  id: string
  flightNumber: string
  airline: string
  airlineIata: string | null
  airport: string
  airportCode: string
  status: string
  statusText: string
  aircraftModel: string
  scheduledArrivalUnix: number | null
  scheduledDepartureUnix: number | null
  realArrivalUnix: number | null
  realDepartureUnix: number | null
  estimatedArrivalUnix: number | null
  estimatedDepartureUnix: number | null
}

export type BoardKind = 'arrival' | 'departure'

export interface BoardAirlineCount {
  key: string
  airline: string
  airlineIata: string | null
  count: number
}

export type FlightStatTone = 'neutral' | 'accent' | 'good' | 'warn' | 'danger'

export type OverheadAirportRole = 'arrival' | 'departure'

export interface OverheadDelayInfo {
  label: string
  tone: FlightStatTone
}

export interface FlightStatItem {
  id: string
  label: string
  value: string | number
  unit?: string
  tone?: FlightStatTone
}

export interface FlightStatGroup {
  id: string
  title: string
  symbol: string
  stats: FlightStatItem[]
}
