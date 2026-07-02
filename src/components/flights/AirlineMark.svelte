<script lang="ts">
  import { airlineLogoUrl } from '../../lib/flights/utils'

  interface Props {
    name: string
    iata: string | null
    suffix?: string
    class?: string
  }

  let { name, iata, suffix = '', class: className = '' }: Props = $props()

  let logoFailed = $state(false)
  const logoUrl = $derived(airlineLogoUrl(iata))

  $effect(() => {
    iata
    logoFailed = false
  })
</script>

<p class="airline-mark {className}">
  {#if logoUrl && !logoFailed}
    <img
      class="airline-mark-logo"
      src={logoUrl}
      alt=""
      loading="lazy"
      onerror={() => (logoFailed = true)}
    />
  {/if}
  <span class="airline-mark-name">{name}</span>
  {#if suffix}
    <span class="airline-mark-suffix">{suffix}</span>
  {/if}
</p>

<style>
  .airline-mark {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0.1rem 0 0;
    min-width: 0;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .airline-mark-logo {
    width: 1.25rem;
    height: 1.25rem;
    object-fit: contain;
    flex-shrink: 0;
    border-radius: 0.2rem;
    background: #fff;
    padding: 0.1rem;
  }

  .airline-mark-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    color: var(--color-text);
  }

  .airline-mark-suffix {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 1;
    min-width: 0;
  }
</style>
