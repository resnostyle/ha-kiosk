export type WeatherKind =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'fog'
  | 'wind'
  | 'unknown'

export interface WeatherTheme {
  kind: WeatherKind
  label: string
  gradient: string
  glow: string
  accent: string
}

const CONDITION_MAP: Record<string, WeatherKind> = {
  sunny: 'clear',
  clear: 'clear',
  clear_night: 'clear',
  partlycloudy: 'partly-cloudy',
  partly_cloudy: 'partly-cloudy',
  cloudy: 'cloudy',
  overcast: 'cloudy',
  rainy: 'rain',
  pouring: 'rain',
  rain: 'rain',
  drizzle: 'rain',
  lightning_rainy: 'storm',
  lightning: 'storm',
  snowy: 'snow',
  snowy_rainy: 'snow',
  hail: 'storm',
  fog: 'fog',
  mist: 'fog',
  windy: 'wind',
  exceptional: 'storm',
}

const THEMES: Record<WeatherKind, Omit<WeatherTheme, 'kind' | 'label'>> = {
  clear: {
    gradient: 'linear-gradient(145deg, #1a3a5c 0%, #2d5a87 35%, #f59e0b22 100%)',
    glow: 'rgba(251, 191, 36, 0.35)',
    accent: '#fbbf24',
  },
  'partly-cloudy': {
    gradient: 'linear-gradient(145deg, #1e3a52 0%, #3d6a8a 45%, #94a3b822 100%)',
    glow: 'rgba(148, 163, 184, 0.3)',
    accent: '#94a3b8',
  },
  cloudy: {
    gradient: 'linear-gradient(145deg, #1a2430 0%, #334155 55%, #47556933 100%)',
    glow: 'rgba(100, 116, 139, 0.25)',
    accent: '#94a3b8',
  },
  rain: {
    gradient: 'linear-gradient(160deg, #0f1c2e 0%, #1e3a5f 50%, #38bdf822 100%)',
    glow: 'rgba(56, 189, 248, 0.3)',
    accent: '#38bdf8',
  },
  storm: {
    gradient: 'linear-gradient(160deg, #0c1220 0%, #1e1b4b 45%, #6366f144 100%)',
    glow: 'rgba(129, 140, 248, 0.4)',
    accent: '#818cf8',
  },
  snow: {
    gradient: 'linear-gradient(145deg, #1a2744 0%, #3b4f6b 50%, #e2e8f018 100%)',
    glow: 'rgba(226, 232, 240, 0.25)',
    accent: '#e2e8f0',
  },
  fog: {
    gradient: 'linear-gradient(145deg, #1a222d 0%, #374151 60%, #9ca3af22 100%)',
    glow: 'rgba(156, 163, 175, 0.2)',
    accent: '#9ca3af',
  },
  wind: {
    gradient: 'linear-gradient(145deg, #152535 0%, #2d4a62 55%, #5eb8ff22 100%)',
    glow: 'rgba(94, 184, 255, 0.25)',
    accent: '#5eb8ff',
  },
  unknown: {
    gradient: 'linear-gradient(145deg, #1a222d 0%, #242f3d 100%)',
    glow: 'rgba(94, 184, 255, 0.15)',
    accent: '#5eb8ff',
  },
}

export function normalizeCondition(raw: string | undefined): string {
  return (raw ?? 'unknown').toLowerCase().replace(/-/g, '_')
}

export function getWeatherKind(condition: string | undefined): WeatherKind {
  if (!condition) return 'unknown'
  const normalized = normalizeCondition(condition)
  const compact = normalized.replace(/_/g, '')
  return CONDITION_MAP[normalized] ?? CONDITION_MAP[compact] ?? 'unknown'
}

export function getWeatherTheme(condition: string | undefined): WeatherTheme {
  const kind = getWeatherKind(condition)
  const label = (condition ?? 'unknown').replace(/_/g, ' ').replace(/-/g, ' ')
  return { kind, label, ...THEMES[kind] }
}

export function isNightCondition(condition: string | undefined): boolean {
  const c = normalizeCondition(condition)
  return c.includes('night') || c === 'clear_night'
}

export function formatConditionLabel(condition: string | undefined): string {
  if (!condition) return 'Unknown'
  return condition.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
