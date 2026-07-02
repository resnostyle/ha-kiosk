<script lang="ts">
  interface Props {
    compact?: boolean
  }

  let { compact = false }: Props = $props()

  let now = $state(new Date())

  $effect(() => {
    const id = setInterval(() => {
      now = new Date()
    }, 1000)
    return () => clearInterval(id)
  })

  const timeFmt = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
</script>

<header class={compact ? 'space-y-0.5' : 'space-y-1'}>
  <p
    class="font-semibold tracking-tight text-[var(--color-text)]"
    class:text-4xl={!compact}
    class:text-2xl={compact}
  >
    {timeFmt.format(now)}
  </p>
  {#if !compact}
    <p class="text-lg text-[var(--color-text-muted)]">{dateFmt.format(now)}</p>
  {:else}
    <p class="text-sm text-[var(--color-text-muted)]">{dateFmt.format(now)}</p>
  {/if}
</header>
