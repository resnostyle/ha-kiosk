<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { personLabel } from '../lib/config/types'
  import { isEntityAvailable, personIsHome } from '../lib/ha/utils'

  interface Props {
    people: Array<{ entityId: string; entity: HassEntity | undefined }>
    compact?: boolean
    row?: boolean
  }

  let { people, compact = false, row = false }: Props = $props()
</script>

<section class="panel people-row" class:people-row-compact={compact || row}>
  <h2 class="people-row-title">Who's Home</h2>
  <div
    class="people-row-grid"
    class:people-row-grid-row={row}
    class:people-row-grid-compact={compact && !row}
  >
    {#each people as { entityId, entity }}
      {@const label = personLabel(entityId)}
      {@const home = personIsHome(entity)}
      {@const offline = !isEntityAvailable(entity)}
      <div
        class="people-row-item"
        class:opacity-60={offline}
      >
        <div
          class="people-row-dot"
          class:people-row-dot-home={home && !offline}
          class:people-row-dot-away={!home && !offline}
          class:people-row-dot-offline={offline}
        ></div>
        <span class="people-row-name">{label}</span>
        <span class="people-row-status">
          {#if offline}
            offline
          {:else if home}
            home
          {:else}
            away
          {/if}
        </span>
      </div>
    {/each}
  </div>
</section>

<style>
  .people-row {
    padding: 0.875rem 1rem;
  }

  .people-row-compact {
    padding: 0.75rem 1rem;
  }

  .people-row-title {
    margin: 0 0 0.65rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .people-row-grid {
    display: grid;
    gap: 0.65rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .people-row-grid-compact {
    grid-template-columns: 1fr;
  }

  .people-row-grid-row {
    grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  }

  .people-row-item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.75rem;
    border-radius: 0.75rem;
    background: var(--color-surface-overlay);
    min-width: 0;
  }

  .people-row-dot {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .people-row-dot-home {
    background: var(--color-success);
  }

  .people-row-dot-away {
    background: var(--color-text-muted);
  }

  .people-row-dot-offline {
    background: var(--color-danger);
  }

  .people-row-name {
    font-weight: 500;
    font-size: 0.9375rem;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .people-row-grid-compact .people-row-name {
    font-size: 0.875rem;
  }

  .people-row-status {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
</style>
