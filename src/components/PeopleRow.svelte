<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { PERSON_LABELS } from '../lib/config/types'
  import { isEntityAvailable, personIsHome } from '../lib/ha/utils'

  interface Props {
    people: Array<{ entityId: string; entity: HassEntity | undefined }>
    compact?: boolean
  }

  let { people, compact = false }: Props = $props()
</script>

<section class="panel p-5 h-full">
  <h2 class="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-4">
    Who's Home
  </h2>
  <div
    class="grid gap-3"
    class:grid-cols-2={!compact}
    class:grid-cols-1={compact}
  >
    {#each people as { entityId, entity }}
      {@const label = PERSON_LABELS[entityId] ?? entityId}
      {@const home = personIsHome(entity)}
      {@const offline = !isEntityAvailable(entity)}
      <div
        class="flex items-center gap-3 rounded-xl px-4 py-3 bg-[var(--color-surface-overlay)]"
        class:opacity-60={offline}
      >
        <div
          class="w-3 h-3 rounded-full shrink-0"
          class:bg-[var(--color-success)]={home && !offline}
          class:bg-[var(--color-text-muted)]={!home && !offline}
          class:bg-[var(--color-danger)]={offline}
        ></div>
        <span class="font-medium" class:text-lg={!compact} class:text-base={compact}>{label}</span>
        <span class="ml-auto text-sm text-[var(--color-text-muted)]">
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
