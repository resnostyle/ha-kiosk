<script lang="ts">
  import type { FlightOpsItem } from '../../lib/flights/types'

  interface Props {
    items: FlightOpsItem[]
    updated?: string
  }

  let { items, updated = '—' }: Props = $props()
</script>

<section class="flight-ops-strip panel" aria-label="Airport operations">
  <div class="flight-ops-metrics">
    {#each items as item (item.id)}
      <div class="flight-ops-metric" data-tone={item.tone ?? 'neutral'}>
        <span class="flight-ops-label">{item.label}</span>
        <span class="flight-ops-value">{item.value}</span>
      </div>
    {/each}
  </div>
  <span class="flight-ops-updated">Updated {updated}</span>
</section>

<style>
  .flight-ops-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.35rem 0.55rem;
    flex-wrap: wrap;
  }

  .flight-ops-metrics {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem 0.55rem;
    min-width: 0;
  }

  .flight-ops-metric {
    --ops-color: var(--color-text);
    display: inline-flex;
    align-items: baseline;
    gap: 0.28rem;
    white-space: nowrap;
  }

  .flight-ops-metric:not(:last-child)::after {
    content: '';
    width: 1px;
    height: 0.75rem;
    margin-left: 0.25rem;
    background: color-mix(in srgb, var(--color-border) 80%, transparent);
    align-self: center;
  }

  .flight-ops-metric[data-tone='good'] {
    --ops-color: var(--color-success);
  }

  .flight-ops-metric[data-tone='warn'] {
    --ops-color: var(--color-warning);
  }

  .flight-ops-metric[data-tone='danger'] {
    --ops-color: var(--color-danger);
  }

  .flight-ops-metric[data-tone='accent'] {
    --ops-color: var(--color-accent);
  }

  .flight-ops-label {
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .flight-ops-value {
    font-size: 0.8125rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--ops-color);
  }

  .flight-ops-updated {
    font-size: 0.5625rem;
    font-weight: 500;
    color: var(--color-text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
