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
  }

  let { entity }: Props = $props()

  const forecast = $derived(forecastDays(entity, 5))
</script>

<section class="panel p-8 h-full flex flex-col justify-between">
  {#if !isEntityAvailable(entity)}
    <div class="flex-1 flex items-center justify-center">
      <span class="chip chip-offline">Weather offline</span>
    </div>
  {:else}
    <div>
      <p class="text-sm font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
        Right now
      </p>
      <p class="text-[7rem] font-bold leading-none tracking-tight mt-2">
        {entity?.state ?? '—'}°
      </p>
      <p class="text-3xl text-[var(--color-text-muted)] capitalize mt-2">
        {weatherCondition(entity)}
      </p>
      {#if entity?.attributes?.apparent_temperature != null}
        <p class="text-xl text-[var(--color-text-muted)] mt-1">
          Feels like {entity.attributes.apparent_temperature}°
        </p>
      {/if}
    </div>

    {#if forecast.length > 0}
      <div class="grid grid-cols-5 gap-3 mt-8">
        {#each forecast as day}
          <div class="rounded-xl bg-[var(--color-surface-overlay)] px-4 py-4 text-center">
            <p class="text-sm text-[var(--color-text-muted)]">
              {day.datetime
                ? new Date(day.datetime).toLocaleDateString(undefined, { weekday: 'short' })
                : '—'}
            </p>
            <p class="text-2xl font-semibold mt-2">{day.temperature ?? '—'}°</p>
            <p class="text-xs text-[var(--color-text-muted)] capitalize mt-1 truncate">
              {day.condition?.replace(/_/g, ' ') ?? ''}
            </p>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</section>
