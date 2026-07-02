<script lang="ts">
  import { onMount } from 'svelte'
  import KioskPage from './routes/KioskPage.svelte'
  import TVPage from './routes/TVPage.svelte'

  type Route = 'kiosk' | 'tv'

  let route = $state<Route>('kiosk')

  function parseHash(): Route {
    const hash = window.location.hash.replace(/^#\/?/, '')
    if (hash === 'tv') return 'tv'
    return 'kiosk'
  }

  onMount(() => {
    route = parseHash()
    const onHashChange = () => {
      route = parseHash()
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  })
</script>

<main class="min-h-dvh">
  {#if route === 'tv'}
    <TVPage />
  {:else}
    <KioskPage />
  {/if}
</main>
