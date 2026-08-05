<script lang="ts">
  interface Props {
    src?: string | null
    label?: string
    size?: 'sm' | 'md' | 'lg'
    class?: string
  }

  let { src = null, label = '', size = 'md', class: className = '' }: Props = $props()

  let failed = $state(false)

  $effect(() => {
    src
    failed = false
  })
</script>

<span class="aircraft-thumb aircraft-thumb--{size} {className}" aria-hidden={!label}>
  {#if src && !failed}
    <img src={src} alt={label} loading="lazy" onerror={() => (failed = true)} />
  {:else}
    <span class="aircraft-thumb-fallback">✈</span>
  {/if}
</span>

<style>
  .aircraft-thumb {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 0.35rem;
    background: color-mix(in srgb, var(--color-surface-raised) 80%, #0a1628);
    border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  }

  .aircraft-thumb--sm {
    width: 1.75rem;
    height: 1.25rem;
    border-radius: 0.25rem;
  }

  .aircraft-thumb--md {
    width: 2.75rem;
    height: 1.75rem;
  }

  .aircraft-thumb--lg {
    width: 3.5rem;
    height: 2.25rem;
    border-radius: 0.4rem;
  }

  .aircraft-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .aircraft-thumb-fallback {
    font-size: 0.75rem;
    line-height: 1;
    opacity: 0.55;
  }

  .aircraft-thumb--lg .aircraft-thumb-fallback {
    font-size: 1rem;
  }
</style>
