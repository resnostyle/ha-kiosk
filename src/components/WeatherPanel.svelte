<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import {
    forecastDays,
    formatTemperature,
    isEntityAvailable,
    weatherCondition,
  } from '../lib/ha/utils'

  interface Props {
    entity: HassEntity | undefined
    compact?: boolean
  }

  let { entity, compact = false }: Props = $props()

  const forecast = $derived(forecastDays(entity, compact ? 3 : 5))
</script>

<section class="panel p-5 h-full flex flex-col">
  <h2 class="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
    Weather
  </h2>

  {#if !isEntityAvailable(entity)}
    <div class="flex-1 flex items-center justify-center">
      <span class="chip chip-offline">Offline</span>
    </div>
  {:else}
    <div class="flex items-baseline gap-3 mb-4">
      <span class="text-5xl font-bold tracking-tight">{formatTemperature(entity)}</span>
      <span class="text-lg text-[var(--color-text-muted)] capitalize">
        {weatherCondition(entity)}
      </span>
    </div>

    {#if forecast.length > 0}
      <div class="mt-auto grid gap-2" style="grid-template-columns: repeat({forecast.length}, 1fr)">
        {#each forecast as day}
          <div class="text-center rounded-lg bg-[var(--color-surface-overlay)] px-2 py-2">
            <p class="text-xs text-[var(--color-text-muted)] truncate">
              {day.datetime
                ? new Date(day.datetime).toLocaleDateString(undefined, { weekday: 'short' })
                : '—'}
            </p>
            <p class="text-sm font-semibold mt-1">{day.temperature ?? '—'}°</p>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</section>
