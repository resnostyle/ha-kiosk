<script lang="ts">
  import { fade, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import type { FlightStatGroup } from '../../lib/flights/types'
  import AnimatedFlightValue from './AnimatedFlightValue.svelte'

  interface Props {
    groups: FlightStatGroup[]
  }

  let { groups }: Props = $props()
</script>

<section class="flight-stats panel" aria-label="Flight statistics">
  {#each groups as group (group.id)}
    <div class="flight-stats-group">
      <header class="flight-stats-group-header">
        <span class="flight-stats-symbol" aria-hidden="true">{group.symbol}</span>
        <h2 class="section-label">{group.title}</h2>
      </header>

      <dl class="flight-stats-metrics">
        {#each group.stats as stat (stat.id)}
          <div class="flight-stat" data-tone={stat.tone ?? 'neutral'}>
            <dt class="flight-stat-label">{stat.label}</dt>
            <dd class="flight-stat-value">
              <AnimatedFlightValue value={stat.value} />
              {#if stat.unit && stat.value !== '—'}
                <span class="flight-stat-unit">{stat.unit}</span>
              {/if}
            </dd>
          </div>
        {/each}
      </dl>
    </div>
  {/each}
</section>

<style>
  .flight-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    padding: 0;
    overflow: hidden;
  }

  .flight-stats-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    min-width: 0;
  }

  .flight-stats-group:not(:last-child) {
    border-right: 1px solid var(--color-border);
  }

  .flight-stats-group-header {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .flight-stats-symbol {
    display: grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
    background: color-mix(in srgb, var(--color-accent) 14%, transparent);
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .flight-stats-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
    margin: 0;
  }

  .flight-stat {
    --stat-color: var(--color-text);
    min-width: 0;
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

  .flight-stat[data-tone='neutral'] {
    --stat-color: var(--color-text);
  }

  .flight-stat-label {
    margin: 0;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--color-text-muted);
    line-height: 1.2;
  }

  .flight-stat-value {
    margin: 0.15rem 0 0;
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--stat-color);
  }

  .flight-stat-unit {
    margin-left: 0.15rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  @media (max-width: 900px) {
    .flight-stats {
      grid-template-columns: 1fr;
    }

    .flight-stats-group:not(:last-child) {
      border-right: none;
      border-bottom: 1px solid var(--color-border);
    }
  }
</style>
