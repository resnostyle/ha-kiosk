<script lang="ts">
  import type { ConnectionStatus } from '../lib/ha/utils'

  interface Props {
    status: ConnectionStatus
    error?: string | null
  }

  let { status, error = null }: Props = $props()

  const labels: Record<ConnectionStatus, string> = {
    connecting: 'Loading Home Assistant…',
    connected: '',
    reconnecting: 'Reconnecting…',
    error: 'Connection error',
  }

  const bannerClass = $derived.by(() => {
    const base = 'fixed top-0 inset-x-0 z-50 px-4 py-2 text-center text-sm font-medium'
    switch (status) {
      case 'reconnecting':
        return `${base} bg-amber-500/90 text-black`
      case 'error':
        return `${base} bg-red-600/90 text-white`
      case 'connecting':
        return `${base} bg-sky-600/90 text-white`
      default:
        return base
    }
  })
</script>

{#if status !== 'connected'}
  <div class={bannerClass}>
    {labels[status]}
    {#if error && status === 'error'}
      <span class="opacity-80"> — {error}</span>
    {/if}
  </div>
{/if}
