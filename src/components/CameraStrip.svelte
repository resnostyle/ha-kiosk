<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { cameraSnapshotUrl } from '../lib/ha/utils'

  interface Props {
    cameraId: string
    occupancy: HassEntity | undefined
    label?: string
  }

  let { cameraId, occupancy, label = 'Garage' }: Props = $props()

  const showCamera = $derived(occupancy?.state === 'on')
  let snapshotUrl = $state('')

  $effect(() => {
    if (!showCamera) {
      snapshotUrl = ''
      return
    }
    const update = () => {
      snapshotUrl = `${cameraSnapshotUrl(cameraId)}&t=${Date.now()}`
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  })
</script>

<section class="panel p-4 h-full flex flex-col">
  <h2 class="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
    {label} Camera
  </h2>

  {#if showCamera}
    <div class="flex-1 relative rounded-xl overflow-hidden bg-black min-h-[12rem]">
      {#if snapshotUrl}
        <img
          src={snapshotUrl}
          alt="{label} camera"
          class="w-full h-full object-cover"
        />
      {/if}
      <span class="absolute top-3 left-3 chip chip-on">Motion</span>
    </div>
  {:else}
    <div
      class="flex-1 flex items-center justify-center rounded-xl bg-[var(--color-surface-overlay)] min-h-[12rem]"
    >
      <p class="text-[var(--color-text-muted)]">No activity</p>
    </div>
  {/if}
</section>
