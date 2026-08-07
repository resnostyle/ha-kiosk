export interface OverheadFlight {
  id: string
  callsign: string
  flightNumber: string | null
  airline: string
  airlineIata: string | null
  aircraftModel: string
  aircraftCode: string | null
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
  aircraftCode: string | null
  registration: string | null
  photoUrl: string | null
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

export interface FlightOpsItem {
  id: string
  label: string
  value: string
  tone?: FlightStatTone
}

export type InterestingFlightReason = 'heavy' | 'cargo' | 'live'

export type AircraftManufacturer = 'airbus' | 'boeing' | 'embraer' | 'mitsubishi' | 'bombardier' | 'other'

export interface AircraftManufacturerCounts {
  airbus: number
  boeing: number
  other: number
}

export interface InterestingBoardFlight {
  flight: BoardFlight
  kind: BoardKind
  reason: InterestingFlightReason
}

export type SpotlightReason = InterestingFlightReason | 'overhead' | 'delayed'

export interface SpotlightFlight {
  id: string
  overhead: OverheadFlight | null
  board: BoardFlight | null
  kind: BoardKind | null
  reason: SpotlightReason
  score: number
}

export interface BoardSpotlightPair {
  arrival: SpotlightFlight | null
  departure: SpotlightFlight | null
}
