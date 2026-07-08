<script lang="ts">
  import { onMount } from 'svelte'
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { formatLocalTime, tomorrowDateRange } from '../lib/evening/time'
  import { getCalendarEvents, getDailyForecast } from '../lib/ha/services'
  import type { CalendarEvent } from '../lib/ha/services'
  import { formatConditionLabel, getWeatherKind, isNightCondition } from '../lib/weather/theme'
  import WeatherIcon from './weather/WeatherIcon.svelte'
  import type { WeatherForecastDay } from '../lib/ha/utils'

  const REFRESH_MS = 30 * 60 * 1000

  interface Props {
    weatherEntityId: string
    sunriseEntity: HassEntity | undefined
    workdayCalendarId: string
    personalCalendarId: string
    compact?: boolean
  }

  let {
    weatherEntityId,
    sunriseEntity,
    workdayCalendarId,
    personalCalendarId,
    compact = false,
  }: Props = $props()

  let forecast = $state<WeatherForecastDay | null>(null)
  let workdayTomorrow = $state<boolean | null>(null)
  let personalEvents = $state<CalendarEvent[]>([])

  const sunriseLabel = $derived(formatLocalTime(sunriseEntity?.state))
  const tomorrowKind = $derived(getWeatherKind(forecast?.condition))
  const tomorrowNight = $derived(isNightCondition(forecast?.condition))

  const headline = $derived.by(() => {
    if (!forecast) return 'Tomorrow'
    const weekday = forecast.datetime
      ? new Date(forecast.datetime).toLocaleDateString(undefined, { weekday: 'short' })
      : 'Tomorrow'
    const temp = forecast.temperature != null ? `${Math.round(forecast.temperature)}°` : '—'
    const condition = formatConditionLabel(forecast.condition)
    return `${weekday} · ${temp} ${condition}`
  })

  onMount(() => {
    let cancelled = false

    async function refresh() {
      const { start, end } = tomorrowDateRange()
      try {
        const [days, workEvents, personal] = await Promise.all([
          getDailyForecast(weatherEntityId),
          getCalendarEvents(workdayCalendarId, start, end),
          getCalendarEvents(personalCalendarId, start, end),
        ])
        if (cancelled) return
        const tomorrowKey = start.toISOString().slice(0, 10)
        forecast =
          days.find((day) => day.datetime?.startsWith(tomorrowKey)) ?? days[1] ?? days[0] ?? null
        workdayTomorrow = workEvents.some((event) =>
          /workday/i.test(event.summary),
        )
        personalEvents = personal
          .filter((event) => !/workday/i.test(event.summary))
          .slice(0, 2)
      } catch {
        if (!cancelled) {
          forecast = null
          workdayTomorrow = null
          personalEvents = []
        }
      }
    }

    void refresh()
    const interval = window.setInterval(refresh, REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  })
</script>

<section class="tomorrow-strip" class:tomorrow-strip-compact={compact} aria-label="Tomorrow preview">
  <div class="tomorrow-main">
    {#if forecast}
      <WeatherIcon kind={tomorrowKind} night={tomorrowNight} size="sm" />
    {/if}
    <div class="tomorrow-copy">
      <p class="tomorrow-headline">{headline}</p>
      <p class="tomorrow-meta">
        {#if sunriseLabel}
          Sunrise {sunriseLabel}
        {/if}
        {#if workdayTomorrow === true}
          {#if sunriseLabel}
            ·
          {/if}
          Work day
        {:else if workdayTomorrow === false}
          {#if sunriseLabel}
            ·
          {/if}
          Day off
        {/if}
      </p>
    </div>
  </div>

  {#if personalEvents.length > 0}
    <ul class="tomorrow-events">
      {#each personalEvents as event (event.summary + event.start)}
        <li>{event.summary}</li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .tomorrow-strip {
    padding: 0.75rem 0.9rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, #818cf8 24%, var(--color-border));
    background: color-mix(in srgb, #312e81 28%, var(--color-surface-raised));
  }

  .tomorrow-strip-compact {
    padding: 0.6rem 0.75rem;
  }

  .tomorrow-main {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .tomorrow-copy {
    min-width: 0;
  }

  .tomorrow-headline {
    margin: 0;
    font-size: clamp(0.95rem, 2.8vw, 1.15rem);
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .tomorrow-meta {
    margin: 0.2rem 0 0;
    font-size: 0.78rem;
    color: var(--color-text-muted);
  }

  .tomorrow-events {
    list-style: none;
    margin: 0.55rem 0 0;
    padding: 0.55rem 0 0;
    border-top: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .tomorrow-events li {
    font-size: 0.8rem;
    color: color-mix(in srgb, var(--color-text) 88%, var(--color-text-muted));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
