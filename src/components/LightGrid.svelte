<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { lightLabel, type EntityConfig } from '../lib/config/types'
  import { toggleLight } from '../lib/ha/services'
  import { isEntityAvailable, isOn } from '../lib/ha/utils'

  interface Props {
    lights: Array<{
      key: keyof EntityConfig['lights']
      entityId: string
      entity: HassEntity | undefined
    }>
  }

  let { lights }: Props = $props()

  async function handleToggle(entityId: string) {
    try {
      await toggleLight(entityId)
    } catch (err) {
      console.error('Failed to toggle light', entityId, err)
    }
  }
</script>

<section class="panel p-5 h-full">
  <h2 class="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-4">
    Lights
  </h2>
  <div class="grid grid-cols-2 gap-3">
    {#each lights as { key, entityId, entity }}
      {@const label = lightLabel(key)}
      {@const on = isOn(entity)}
      {@const offline = !isEntityAvailable(entity)}
      <button
        type="button"
        class="rounded-xl px-4 py-5 text-left transition-colors min-h-[4.5rem] border"
        class:bg-[var(--color-accent)]={on && !offline}
        class:text-[#0f1419]={on && !offline}
        class:border-transparent={on && !offline}
        class:bg-[var(--color-surface-overlay)]={!on || offline}
        class:border-[var(--color-border)]={!on || offline}
        class:opacity-50={offline}
        disabled={offline}
        onclick={() => handleToggle(entityId)}
      >
        <span class="block font-semibold text-base">{label}</span>
        <span class="block text-sm mt-1 opacity-80">
          {#if offline}
            offline
          {:else if on}
            on
          {:else}
            off
          {/if}
        </span>
      </button>
    {/each}
  </div>
</section>
