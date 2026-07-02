<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { forecastDays, isEntityAvailable } from '../../lib/ha/utils'
  import { formatConditionLabel, getWeatherTheme, isNightCondition } from '../../lib/weather/theme'
  import AnimatedTemp from './AnimatedTemp.svelte'
  import WeatherAmbient from './WeatherAmbient.svelte'
  import WeatherIcon from './WeatherIcon.svelte'

  interface Props {
    entity: HassEntity | undefined
    compact?: boolean
  }

  let { entity, compact = false }: Props = $props()

  const forecast = $derived(compact ? [] : forecastDays(entity, 3))
  const theme = $derived(getWeatherTheme(entity?.state))
  const night = $derived(isNightCondition(entity?.state))
  const available = $derived(isEntityAvailable(entity))
</script>

<section
  class="weather-nest"
  class:weather-nest-compact={compact}
  style:--weather-gradient={theme.gradient}
  style:--weather-glow={theme.glow}
  style:--weather-accent={theme.accent}
>
  <WeatherAmbient kind={theme.kind} {night} />

  <div class="weather-nest-inner">
    {#if !available}
      <div class="weather-nest-offline">
        <span class="chip chip-offline">Weather offline</span>
      </div>
    {:else}
      <div class="weather-nest-now">
        <WeatherIcon kind={theme.kind} {night} size={compact ? 'sm' : 'md'} />
        <div class="weather-nest-details">
          <div class="weather-nest-temp-row">
            <AnimatedTemp
              value={entity?.state}
              size={compact ? 'sm' : 'md'}
              accent={theme.accent}
            />
          </div>
          <p class="weather-nest-condition">{formatConditionLabel(entity?.state)}</p>
          {#if !compact}
            <p class="weather-nest-meta">
              {#if entity?.attributes?.apparent_temperature != null}
                Feels {entity.attributes.apparent_temperature}°
              {/if}
              {#if entity?.attributes?.humidity != null}
                {#if entity?.attributes?.apparent_temperature != null}
                  ·
                {/if}
                {entity.attributes.humidity}% humidity
              {/if}
            </p>
          {/if}
        </div>
      </div>

      {#if forecast.length > 0}
        <div class="weather-nest-forecast">
          {#each forecast as day, i (day.datetime ?? i)}
            <div class="weather-nest-day">
              <span class="weather-nest-day-name">
                {day.datetime
                  ? new Date(day.datetime).toLocaleDateString(undefined, { weekday: 'short' })
                  : '—'}
              </span>
              <span class="weather-nest-day-temp">{day.temperature ?? '—'}°</span>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</section>

<style>
  .weather-nest {
    position: relative;
    overflow: hidden;
    width: 100%;
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--weather-accent) 22%, var(--color-border));
    background: var(--weather-gradient);
    box-shadow: 0 8px 28px -8px var(--weather-glow);
  }

  .weather-nest-compact .weather-nest-inner {
    padding: 0.6rem 0.75rem;
  }

  .weather-nest-inner {
    position: relative;
    z-index: 1;
    padding: 1rem 1.1rem;
    display: flex;
    flex-direction: column;
  }

  .weather-nest-offline {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .weather-nest-now {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .weather-nest-details {
    min-width: 0;
    flex: 1;
  }

  .weather-nest-temp-row :global(.animated-temp) {
    line-height: 1;
  }

  .weather-nest-temp-row :global(.temp-md .temp-value) {
    font-size: 2.25rem;
  }

  .weather-nest-compact .weather-nest-temp-row :global(.temp-sm .temp-value) {
    font-size: 1.65rem;
  }

  .weather-nest-compact .weather-nest-condition {
    font-size: 0.85rem;
  }

  .weather-nest-condition {
    margin: 0.2rem 0 0;
    font-size: 1rem;
    font-weight: 500;
    color: color-mix(in srgb, var(--color-text) 88%, var(--weather-accent));
    text-transform: capitalize;
  }

  .weather-nest-meta {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .weather-nest-forecast {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.85rem;
    border-top: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  }

  .weather-nest-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    padding: 0.5rem 0.35rem;
    border-radius: 0.625rem;
    background: rgba(255, 255, 255, 0.05);
    min-height: 3rem;
  }

  .weather-nest-day-name {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
  }

  .weather-nest-day-temp {
    font-size: 1.05rem;
    font-weight: 700;
  }

</style>
