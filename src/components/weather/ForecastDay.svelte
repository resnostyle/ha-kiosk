<script lang="ts">
  import { formatConditionLabel, getWeatherKind, isNightCondition } from '../../lib/weather/theme'
  import WeatherIcon from './WeatherIcon.svelte'

  interface Props {
    datetime?: string
    temperature?: number
    templow?: number
    condition?: string
    index?: number
    compact?: boolean
  }

  let { datetime, temperature, templow, condition, index = 0, compact = false }: Props = $props()

  const weekday = $derived(
    datetime
      ? new Date(datetime).toLocaleDateString(undefined, { weekday: compact ? 'short' : 'short' })
      : '—',
  )

  const kind = $derived(getWeatherKind(condition))
  const night = $derived(isNightCondition(condition))
</script>

<div
  class="forecast-day"
  class:forecast-day-compact={compact}
  style="--delay: {index * 80}ms"
>
  <p class="forecast-weekday">{weekday}</p>
  <div class="forecast-icon-wrap">
    <WeatherIcon {kind} {night} size="md" />
  </div>
  <p class="forecast-temp">
    {#if templow != null}
      <span class="forecast-high">{temperature ?? '—'}°</span>
      <span class="forecast-low">{templow}°</span>
    {:else}
      {temperature ?? '—'}°
    {/if}
  </p>
  {#if !compact && condition}
    <p class="forecast-condition">{formatConditionLabel(condition)}</p>
  {/if}
</div>

<style>
  .forecast-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.75rem 0.5rem;
    border-radius: 0.875rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    animation: forecast-enter 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--delay);
    transition:
      background 0.25s ease,
      transform 0.25s ease,
      border-color 0.25s ease;
  }

  .forecast-day-compact {
    padding: 0.5rem 0.25rem;
    gap: 0.2rem;
  }

  .forecast-day:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  .forecast-weekday {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    margin: 0;
  }

  .forecast-day-compact .forecast-weekday {
    font-size: 0.65rem;
  }

  .forecast-icon-wrap {
    transform: scale(0.55);
    margin: -0.5rem 0;
  }

  .forecast-day-compact .forecast-icon-wrap {
    transform: scale(0.45);
    margin: -0.65rem 0;
  }

  .forecast-temp {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    gap: 0.35rem;
    align-items: baseline;
  }

  .forecast-high {
    font-weight: 700;
  }

  .forecast-low {
    font-size: 0.85em;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  .forecast-day-compact .forecast-temp {
    font-size: 0.9rem;
  }

  .forecast-condition {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    margin: 0;
    text-align: center;
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @keyframes forecast-enter {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .forecast-day {
      animation: none;
    }

    .forecast-day:hover {
      transform: none;
    }
  }
</style>
