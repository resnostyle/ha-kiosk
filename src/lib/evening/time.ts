export const EVENING_TIMEZONE = 'America/New_York'
export const EVENING_START_HOUR = 21
export const EVENING_END_HOUR = 22

export function eveningLocalParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EVENING_TIMEZONE,
    hour: 'numeric',
    hour12: false,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return {
    hour: Number.parseInt(get('hour'), 10),
    weekday: get('weekday'),
    month: get('month'),
    day: get('day'),
  }
}

export function isEveningWindow(date = new Date()): boolean {
  const { hour } = eveningLocalParts(date)
  return hour >= EVENING_START_HOUR && hour < EVENING_END_HOUR
}

export function isAfterEvening(date = new Date()): boolean {
  const { hour } = eveningLocalParts(date)
  return hour >= EVENING_END_HOUR
}

export function isBeforeEvening(date = new Date()): boolean {
  const { hour } = eveningLocalParts(date)
  return hour < EVENING_START_HOUR
}

export function tomorrowDateRange(date = new Date()): { start: Date; end: Date } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: EVENING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const todayKey = formatter.format(date)
  const [year, month, day] = todayKey.split('-').map(Number)
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1))
  const tomorrowKey = formatter.format(tomorrow)
  const [tYear, tMonth, tDay] = tomorrowKey.split('-').map(Number)
  const start = new Date(Date.UTC(tYear, tMonth - 1, tDay, 5, 0, 0))
  const end = new Date(Date.UTC(tYear, tMonth - 1, tDay + 1, 4, 59, 59))
  return { start, end }
}

export function formatLocalTime(
  iso: string | undefined,
  options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' },
): string | null {
  if (!iso) return null
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat(undefined, {
    timeZone: EVENING_TIMEZONE,
    ...options,
  }).format(parsed)
}
