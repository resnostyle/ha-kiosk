<script lang="ts">
  import { onMount } from 'svelte'
  import DashboardNav from './components/DashboardNav.svelte'
  import FlightPage from './routes/FlightPage.svelte'
  import KioskPage from './routes/KioskPage.svelte'
  import MasterBedroomPage from './routes/MasterBedroomPage.svelte'
  import TVPage from './routes/TVPage.svelte'
  import { parseDashboardRoute, type DashboardRoute } from './lib/routes'

  function readRoute(): DashboardRoute {
    return parseDashboardRoute(window.location.hash)
  }

  let route = $state<DashboardRoute>(readRoute())

  onMount(() => {
    const onHashChange = () => {
      route = readRoute()
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  })
</script>

<main class="min-h-dvh">
  {#if route === 'tv'}
    <TVPage />
  {:else if route === 'master-bedroom'}
    <MasterBedroomPage />
  {:else if route === 'flights'}
    <FlightPage />
  {:else}
    <KioskPage />
  {/if}

  <DashboardNav current={route} />
</main>
