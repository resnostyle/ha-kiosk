<script lang="ts">
  import { onMount } from 'svelte'
  import type { HassEntity } from 'home-assistant-js-websocket'
  import ClockHeader from './ClockHeader.svelte'
  import { getDailyForecast } from '../lib/ha/services'
  import {
    forecastDays,
    isEntityAvailable,
    type WeatherForecastDay,
  } from '../lib/ha/utils'
  import { formatConditionLabel, getWeatherTheme, isNightCondition } from '../lib/weather/theme'
  import AnimatedTemp from './weather/AnimatedTemp.svelte'
  import ForecastDay from './weather/ForecastDay.svelte'
  import WeatherAmbient from './weather/WeatherAmbient.svelte'
  import WeatherIcon from './weather/WeatherIcon.svelte'

  const FORECAST_DAYS = 3
  const REFRESH_MS = 30 * 60 * 1000

  interface Props {
    entity: HassEntity | undefined
    weatherEntityId: string
  }

  let { entity, weatherEntityId }: Props = $props()

  let fetchedForecast = $state<WeatherForecastDay[]>([])

  const forecast = $derived(
    fetchedForecast.length > 0
      ? fetchedForecast.slice(0, FORECAST_DAYS)
      : forecastDays(entity, FORECAST_DAYS),
  )
  const theme = $derived(getWeatherTheme(entity?.state))
  const night = $derived(isNightCondition(entity?.state))
  const available = $derived(isEntityAvailable(entity))

  onMount(() => {
    let cancelled = false

    async function refresh() {
      try {
        const next = await getDailyForecast(weatherEntityId)
        if (!cancelled) fetchedForecast = next
      } catch {
        if (!cancelled) fetchedForecast = []
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

<section
  class="kiosk-header"
  style:--weather-gradient={theme.gradient}
  style:--weather-glow={theme.glow}
  style:--weather-accent={theme.accent}
>
  <WeatherAmbient kind={theme.kind} {night} />

  <div class="kiosk-header-inner">
    <div class="kiosk-header-top">
      <ClockHeader kiosk />

      {#if !available}
        <span class="chip chip-offline">Weather offline</span>
      {:else}
        <div class="kiosk-header-weather">
          <WeatherIcon kind={theme.kind} {night} size="md" />
          <div class="kiosk-header-weather-text">
            <AnimatedTemp value={entity?.state} size="md" accent={theme.accent} />
            <p class="kiosk-header-condition">{formatConditionLabel(entity?.state)}</p>
            {#if entity?.attributes?.humidity != null}
              <p class="kiosk-header-meta">{entity.attributes.humidity}% humidity</p>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    {#if available}
      <div class="kiosk-header-forecast-wrap">
        <p class="kiosk-header-forecast-label">{FORECAST_DAYS}-day forecast</p>
        {#if forecast.length > 0}
          <div
            class="kiosk-header-forecast"
            style="grid-template-columns: repeat({forecast.length}, 1fr)"
          >
            {#each forecast as day, i (day.datetime ?? i)}
              <ForecastDay
                datetime={day.datetime}
                temperature={day.temperature}
                templow={day.templow}
                condition={day.condition}
                index={i}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .kiosk-header {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--weather-accent) 25%, var(--color-border));
    background: var(--weather-gradient);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.04) inset,
      0 12px 40px -12px var(--weather-glow);
  }

  .kiosk-header-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
  }

  .kiosk-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-width: 0;
  }

  .kiosk-header-weather {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-shrink: 0;
    text-align: right;
  }

  .kiosk-header-weather-text {
    min-width: 0;
  }

  .kiosk-header-condition {
    margin: 0.1rem 0 0;
    font-size: 0.9rem;
    font-weight: 500;
    color: color-mix(in srgb, var(--color-text) 85%, var(--weather-accent));
    text-transform: capitalize;
    white-space: nowrap;
  }

  .kiosk-header-meta {
    margin: 0.1rem 0 0;
    font-size: 0.7rem;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .kiosk-header-forecast-wrap {
    padding-top: 0.65rem;
    border-top: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
  }

  .kiosk-header-forecast-label {
    margin: 0 0 0.5rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--color-text) 55%, transparent);
  }

  .kiosk-header-forecast {
    display: grid;
    gap: 0.5rem;
  }
</style>
