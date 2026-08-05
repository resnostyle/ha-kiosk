<script lang="ts">
  import type { FlightStatGroup } from '../../lib/flights/types'
  import AnimatedFlightValue from './AnimatedFlightValue.svelte'

  interface Props {
    groups: FlightStatGroup[]
  }

  let { groups }: Props = $props()

  const metrics = $derived(groups.flatMap((group) => group.stats))
</script>

<section class="flight-stats" aria-label="Flight statistics">
  {#each metrics as stat (stat.id)}
    <div class="flight-stat" data-tone={stat.tone ?? 'neutral'}>
      <span class="flight-stat-label">{stat.label}</span>
      <span class="flight-stat-value">
        <AnimatedFlightValue value={stat.value} />
        {#if stat.unit && stat.value !== '—'}
          <span class="flight-stat-unit">{stat.unit}</span>
        {/if}
      </span>
    </div>
  {/each}
</section>

<style>
  .flight-stats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 0.65rem;
    min-width: 0;
  }

  .flight-stat {
    --stat-color: var(--color-text);
    display: inline-flex;
    align-items: baseline;
    gap: 0.3rem;
    min-width: 0;
    white-space: nowrap;
  }

  .flight-stat:not(:last-child)::after {
    content: '';
    width: 1px;
    height: 0.85rem;
    margin-left: 0.3rem;
    background: color-mix(in srgb, var(--color-border) 80%, transparent);
    align-self: center;
  }

  .flight-stat[data-tone='accent'] {
    --stat-color: var(--color-accent);
  }

  .flight-stat[data-tone='good'] {
    --stat-color: var(--color-success);
  }

  .flight-stat[data-tone='warn'] {
    --stat-color: var(--color-warning);
  }

  .flight-stat[data-tone='danger'] {
    --stat-color: var(--color-danger);
  }

  .flight-stat-label {
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    line-height: 1;
  }

  .flight-stat-value {
    font-size: 0.9375rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--stat-color);
  }

  .flight-stat-unit {
    margin-left: 0.1rem;
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }
</style>
