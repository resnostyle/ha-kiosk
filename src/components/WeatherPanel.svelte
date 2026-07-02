<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { forecastDays, isEntityAvailable } from '../lib/ha/utils'
  import { getWeatherTheme, isNightCondition, formatConditionLabel } from '../lib/weather/theme'
  import AnimatedTemp from './weather/AnimatedTemp.svelte'
  import ForecastDay from './weather/ForecastDay.svelte'
  import WeatherAmbient from './weather/WeatherAmbient.svelte'
  import WeatherIcon from './weather/WeatherIcon.svelte'

  interface Props {
    entity: HassEntity | undefined
    compact?: boolean
  }

  let { entity, compact = false }: Props = $props()

  const forecast = $derived(forecastDays(entity, compact ? 3 : 5))
  const theme = $derived(getWeatherTheme(entity?.state))
  const night = $derived(isNightCondition(entity?.state))
  const available = $derived(isEntityAvailable(entity))
</script>

<section
  class="weather-card weather-card-panel"
  class:weather-card-compact={compact}
  style:--weather-gradient={theme.gradient}
  style:--weather-glow={theme.glow}
  style:--weather-accent={theme.accent}
>
  <WeatherAmbient kind={theme.kind} {night} />

  <div class="weather-card-inner">
    <h2 class="weather-label">Weather</h2>

    {#if !available}
      <div class="weather-offline">
        <span class="chip chip-offline">Offline</span>
      </div>
    {:else}
      <div class="weather-current">
        <WeatherIcon kind={theme.kind} {night} size={compact ? 'md' : 'lg'} />
        <div class="weather-current-text">
          <AnimatedTemp
            value={entity?.state}
            size={compact ? 'md' : 'lg'}
            accent={theme.accent}
          />
          <p class="weather-condition">{formatConditionLabel(entity?.state)}</p>
          {#if entity?.attributes?.humidity != null}
            <p class="weather-meta">{entity.attributes.humidity}% humidity</p>
          {/if}
        </div>
      </div>

      {#if forecast.length > 0}
        <div
          class="weather-forecast"
          style="grid-template-columns: repeat({forecast.length}, 1fr)"
        >
          {#each forecast as day, i (day.datetime ?? i)}
            <ForecastDay
              datetime={day.datetime}
              temperature={day.temperature}
              condition={day.condition}
              index={i}
              {compact}
            />
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</section>

<style>
  .weather-card {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--weather-accent) 25%, var(--color-border));
    background: var(--weather-gradient);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.04) inset,
      0 12px 40px -12px var(--weather-glow);
    animation: weather-card-enter 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
    height: 100%;
  }

  .weather-card-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.25rem;
  }

  .weather-card-compact .weather-card-inner {
    padding: 1rem;
  }

  .weather-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: color-mix(in srgb, var(--color-text) 65%, transparent);
    margin: 0 0 0.75rem;
  }

  .weather-offline {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .weather-current {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .weather-current-text {
    min-width: 0;
  }

  .weather-condition {
    margin: 0.25rem 0 0;
    font-size: 1.05rem;
    font-weight: 500;
    color: color-mix(in srgb, var(--color-text) 85%, var(--weather-accent));
    text-transform: capitalize;
    animation: weather-text-fade 0.5s ease both;
  }

  .weather-card-compact .weather-condition {
    font-size: 0.9rem;
  }

  .weather-meta {
    margin: 0.2rem 0 0;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .weather-forecast {
    display: grid;
    gap: 0.5rem;
    margin-top: auto;
  }

  @keyframes weather-card-enter {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes weather-text-fade {
    from {
      opacity: 0;
      transform: translateX(-6px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .weather-card,
    .weather-condition {
      animation: none;
    }
  }
</style>
