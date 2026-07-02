<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { isEntityAvailable, isOn } from '../lib/ha/utils'

  interface Zone {
    entityId: string
    entity: HassEntity | undefined
    label: string
  }

  interface Props {
    zones: Zone[]
  }

  let { zones }: Props = $props()

  const occupiedZones = $derived(
    zones.filter((zone) => isEntityAvailable(zone.entity) && isOn(zone.entity)),
  )
</script>

{#if occupiedZones.length > 0}
  <section class="panel presence-panel">
    <div class="presence-panel-header">
      <h2 class="presence-panel-title">Presence</h2>
      <span class="presence-panel-count">{occupiedZones.length} active</span>
    </div>

    <div class="presence-tabs" role="list" aria-label="Active presence zones">
      {#each occupiedZones as zone (zone.entityId)}
        <div class="presence-tab" role="listitem">
          <span class="presence-tab-dot on"></span>
          <span class="presence-tab-label">{zone.label}</span>
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .presence-panel {
    align-self: start;
    padding: 0.75rem;
  }

  .presence-panel-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .presence-panel-title {
    margin: 0;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .presence-panel-count {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .presence-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .presence-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    max-width: 100%;
    padding: 0.3rem 0.5rem;
    border: 1px solid color-mix(in srgb, var(--color-success) 35%, var(--color-border));
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-success) 8%, var(--color-surface-overlay));
    color: var(--color-text);
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .presence-tab-dot {
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .presence-tab-dot.on {
    background: var(--color-success);
  }

  .presence-tab-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
