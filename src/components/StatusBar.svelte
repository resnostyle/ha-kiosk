<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { isEntityAvailable, isOn } from '../lib/ha/utils'

  interface Props {
    alarm: HassEntity | undefined
    guestMode: HassEntity | undefined
    ticker?: string
  }

  let { alarm, guestMode, ticker }: Props = $props()

  const alarmLabel = $derived.by(() => {
    if (!isEntityAvailable(alarm)) return 'Alarm offline'
    const state = alarm?.state ?? 'unknown'
    return `Alarm: ${state.replace(/_/g, ' ')}`
  })

  const guestOn = $derived(isOn(guestMode))
</script>

<section class="panel px-5 py-3 flex items-center gap-4 overflow-hidden">
  <div class="flex items-center gap-3 shrink-0">
    <span
      class="chip"
      class:chip-on={alarm?.state === 'disarmed'}
      class:chip-off={alarm?.state !== 'disarmed' && isEntityAvailable(alarm)}
      class:chip-offline={!isEntityAvailable(alarm)}
    >
      {alarmLabel}
    </span>
    {#if isEntityAvailable(guestMode)}
      <span class="chip" class:chip-on={guestOn} class:chip-off={!guestOn}>
        Guest mode {guestOn ? 'on' : 'off'}
      </span>
    {/if}
  </div>
  {#if ticker}
    <p class="text-sm text-[var(--color-text-muted)] truncate ml-auto">{ticker}</p>
  {/if}
</section>
