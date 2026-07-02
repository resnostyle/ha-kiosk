<script lang="ts">
  interface Props {
    value: string | number | undefined
    size?: 'sm' | 'md' | 'lg' | 'hero'
    accent?: string
  }

  let { value, size = 'md', accent }: Props = $props()

  const display = $derived(value != null && value !== '' ? String(value) : '—')
  const sizeClass = $derived(
    size === 'hero'
      ? 'temp-hero'
      : size === 'lg'
        ? 'temp-lg'
        : size === 'sm'
          ? 'temp-sm'
          : 'temp-md',
  )
</script>

<div class="animated-temp {sizeClass}" style:--temp-accent={accent}>
  {#key display}
    <span class="temp-value">{display}</span>
  {/key}
  {#if display !== '—'}
    <span class="temp-unit">°</span>
  {/if}
</div>

<style>
  .animated-temp {
    display: inline-flex;
    align-items: flex-start;
    line-height: 1;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .temp-sm .temp-value {
    font-size: 1.65rem;
  }

  .temp-md .temp-value {
    font-size: 3rem;
  }

  .temp-lg .temp-value {
    font-size: 4.5rem;
  }

  .temp-hero .temp-value {
    font-size: clamp(5rem, 12vw, 7rem);
  }

  .temp-unit {
    font-size: 0.45em;
    margin-top: 0.15em;
    opacity: 0.7;
    font-weight: 500;
  }

  .temp-value {
    display: inline-block;
    animation: temp-enter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    text-shadow: 0 0 40px color-mix(in srgb, var(--temp-accent, #5eb8ff) 35%, transparent);
  }

  @keyframes temp-enter {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.92);
      filter: blur(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .temp-value {
      animation: none;
    }
  }
</style>
