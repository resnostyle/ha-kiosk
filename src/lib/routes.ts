export type DashboardRoute = 'kiosk' | 'tv' | 'master-bedroom' | 'playroom' | 'flights' | 'evening'

export interface Dashboard {
  id: DashboardRoute
  hash: string
  label: string
  hint: string
}

export const DASHBOARDS: Dashboard[] = [
  { id: 'kiosk', hash: '#/kiosk', label: 'Kiosk', hint: 'Wall tablet' },
  { id: 'tv', hash: '#/tv', label: 'TV', hint: 'Living room' },
  { id: 'master-bedroom', hash: '#/master-bedroom', label: 'Bedroom', hint: 'Nest Hub' },
  { id: 'playroom', hash: '#/playroom', label: 'Playroom', hint: 'Kids room tablet' },
  { id: 'evening', hash: '#/evening', label: 'Evening', hint: 'Nest Hub night' },
  { id: 'flights', hash: '#/flights', label: 'Flights', hint: 'FlightRadar24' },
]

export function parseDashboardRoute(hash: string): DashboardRoute {
  const path = hash.replace(/^#\/?/, '').split('?')[0]
  if (path === 'tv') return 'tv'
  if (path === 'master-bedroom' || path === 'bedroom') return 'master-bedroom'
  if (path === 'playroom') return 'playroom'
  if (path === 'evening' || path === 'night') return 'evening'
  if (path === 'flights' || path === 'flight') return 'flights'
  return 'kiosk'
}

export function dashboardById(id: DashboardRoute): Dashboard {
  return DASHBOARDS.find((d) => d.id === id) ?? DASHBOARDS[0]
}
