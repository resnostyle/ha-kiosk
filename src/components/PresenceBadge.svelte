<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { isEntityAvailable, isOn } from '../lib/ha/utils'

  interface Props {
    entity: HassEntity | undefined
    label?: string
  }

  let { entity, label = 'Downstairs' }: Props = $props()

  const occupied = $derived(isOn(entity))
  const offline = $derived(!isEntityAvailable(entity))
</script>

<section class="panel p-5 flex items-center justify-between gap-4">
  <div>
    <h2 class="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
      Presence
    </h2>
    <p class="text-xl font-semibold mt-1">{label}</p>
  </div>
  {#if offline}
    <span class="chip chip-offline">Offline</span>
  {:else if occupied}
    <span class="chip chip-on">Occupied</span>
  {:else}
    <span class="chip chip-off">Empty</span>
  {/if}
</section>
