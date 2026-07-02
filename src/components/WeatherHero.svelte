<script lang="ts">
  import { onMount } from 'svelte'
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { getDailyForecast } from '../lib/ha/services'
  import { forecastDays, isEntityAvailable, type WeatherForecastDay } from '../lib/ha/utils'
  import { getWeatherTheme, isNightCondition, formatConditionLabel } from '../lib/weather/theme'
  import AnimatedTemp from './weather/AnimatedTemp.svelte'
  import ForecastDay from './weather/ForecastDay.svelte'
  import WeatherAmbient from './weather/WeatherAmbient.svelte'
  import WeatherIcon from './weather/WeatherIcon.svelte'

  const REFRESH_MS = 30 * 60 * 1000

  interface Props {
    entity: HassEntity | undefined
    weatherEntityId: string
    days?: number
  }

  let { entity, weatherEntityId, days = 3 }: Props = $props()

  let fetchedForecast = $state<WeatherForecastDay[]>([])

  const forecast = $derived(
    fetchedForecast.length > 0
      ? fetchedForecast.slice(0, days)
      : forecastDays(entity, days),
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
  class="weather-card weather-card-hero"
  style:--weather-gradient={theme.gradient}
  style:--weather-glow={theme.glow}
  style:--weather-accent={theme.accent}
>
  <WeatherAmbient kind={theme.kind} {night} />

  <div class="weather-hero-inner">
    {#if !available}
      <div class="weather-offline">
        <span class="chip chip-offline">Weather offline</span>
      </div>
    {:else}
      <div class="weather-hero-top">
        <div class="weather-hero-main">
          <p class="weather-eyebrow">Right now</p>
          <div class="weather-hero-row">
            <AnimatedTemp value={entity?.state} size="hero" accent={theme.accent} />
            <WeatherIcon kind={theme.kind} {night} size="xl" />
          </div>
          <p class="weather-hero-condition">{formatConditionLabel(entity?.state)}</p>
          <div class="weather-hero-stats">
            {#if entity?.attributes?.apparent_temperature != null}
              <span class="weather-stat">
                Feels like <strong>{entity.attributes.apparent_temperature}°</strong>
              </span>
            {/if}
            {#if entity?.attributes?.humidity != null}
              <span class="weather-stat">
                Humidity <strong>{entity.attributes.humidity}%</strong>
              </span>
            {/if}
            {#if entity?.attributes?.wind_speed != null}
              <span class="weather-stat">
                Wind <strong>{entity.attributes.wind_speed}</strong>
                {entity.attributes.wind_speed_unit ?? 'mph'}
              </span>
            {/if}
          </div>
        </div>
      </div>

      {#if forecast.length > 0}
        <div class="weather-hero-forecast-wrap">
          <p class="weather-forecast-label">{days}-day forecast</p>
          <div
            class="weather-hero-forecast"
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
        </div>
      {/if}
    {/if}
  </div>
</section>

<style>
  .weather-card-hero {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--weather-accent) 30%, var(--color-border));
    background: var(--weather-gradient);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.05) inset,
      0 20px 60px -16px var(--weather-glow);
    animation: hero-enter 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
    height: 100%;
  }

  .weather-hero-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 2rem;
  }

  .weather-offline {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .weather-eyebrow {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: color-mix(in srgb, var(--color-text) 60%, transparent);
  }

  .weather-hero-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    margin-top: 0.5rem;
  }

  .weather-hero-condition {
    margin: 0.5rem 0 0;
    font-size: 2rem;
    font-weight: 500;
    color: color-mix(in srgb, var(--color-text) 90%, var(--weather-accent));
    text-transform: capitalize;
    animation: weather-text-fade 0.6s ease 0.15s both;
  }

  .weather-hero-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 1.5rem;
    margin-top: 1rem;
  }

  .weather-stat {
    font-size: 0.95rem;
    color: var(--color-text-muted);
    animation: weather-text-fade 0.5s ease both;
    animation-delay: 0.25s;
  }

  .weather-stat strong {
    color: var(--color-text);
    font-weight: 600;
  }

  .weather-hero-forecast-wrap {
    margin-top: 1.5rem;
    flex-shrink: 0;
  }

  .weather-forecast-label {
    margin: 0 0 0.65rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: color-mix(in srgb, var(--color-text) 55%, transparent);
  }

  .weather-hero-forecast {
    display: grid;
    gap: 0.75rem;
  }

  @keyframes hero-enter {
    from {
      opacity: 0;
      transform: scale(0.97);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes weather-text-fade {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .weather-card-hero,
    .weather-hero-condition,
    .weather-stat {
      animation: none;
    }
  }
</style>
