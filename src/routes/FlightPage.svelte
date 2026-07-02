<script lang="ts">
  import { fade, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import ConnectionBanner from '../components/ConnectionBanner.svelte'
  import ClockHeader from '../components/ClockHeader.svelte'
  import FlightBoard from '../components/flights/FlightBoard.svelte'
  import FlightMap from '../components/flights/FlightMap.svelte'
  import FlightOverheadCard from '../components/flights/FlightOverheadCard.svelte'
  import FlightStats from '../components/flights/FlightStats.svelte'
  import { entityConfig } from '../lib/config/types'
  import {
    delayCountTone,
    delayMinutesTone,
    overheadTone,
    countBoardFlightsByAirline,
    parseBoardFlights,
    parseOverheadFlights,
    sensorCount,
    sortBoardFlights,
    sortOverheadByAirportRole,
    statDisplayValue,
  } from '../lib/flights/utils'
  import type { FlightStatGroup, FlightStatItem } from '../lib/flights/types'
  import { createFreshIdTracker } from '../lib/flights/freshIds.svelte'
  import { useEntityStore } from '../lib/ha/useEntityStore.svelte'
  import { isEntityAvailable } from '../lib/ha/utils'

  const store = useEntityStore()
  const ft = entityConfig.flightTracker
  const overheadFresh = createFreshIdTracker()
  const arrivalsFresh = createFreshIdTracker()
  const departuresFresh = createFreshIdTracker()

  let overheadLive = $state(false)
  let overheadLiveTimer: ReturnType<typeof setTimeout> | undefined

  const airportEntity = $derived(store.entity(ft.airportTrack))
  const airportCode = $derived(
    isEntityAvailable(airportEntity) ? (airportEntity?.state ?? '—') : '—',
  )

  const overhead = $derived(
    sortOverheadByAirportRole(
      parseOverheadFlights(store.entity(ft.currentInArea)),
      airportCode,
    ),
  )
  const arrivalsAll = $derived(
    sortBoardFlights(
      parseBoardFlights(store.entity(ft.airportArrivals), { limit: null }),
      'arrival',
    ),
  )
  const departuresAll = $derived(
    sortBoardFlights(
      parseBoardFlights(store.entity(ft.airportDepartures), { limit: null }),
      'departure',
    ),
  )
  const arrivals = $derived(arrivalsAll.slice(0, 18))
  const departures = $derived(departuresAll.slice(0, 18))
  const arrivalAirlines = $derived(countBoardFlightsByAirline(arrivalsAll))
  const departureAirlines = $derived(countBoardFlightsByAirline(departuresAll))

  $effect(() => {
    overheadFresh.sync(overhead.map((flight) => flight.id))
    arrivalsFresh.sync(arrivals.map((flight) => flight.id))
    departuresFresh.sync(departures.map((flight) => flight.id))
  })

  $effect(() => {
    void overhead.length
    overheadLive = true
    clearTimeout(overheadLiveTimer)
    overheadLiveTimer = setTimeout(() => {
      overheadLive = false
    }, 2200)
    return () => clearTimeout(overheadLiveTimer)
  })

  const mapCenter = $derived(
    ft.mapCenter ?? {
      latitude: 35.8776,
      longitude: -78.7874,
      zoom: 13,
      radiusMiles: 8,
      label: airportCode,
    },
  )

  const statGroups = $derived.by((): FlightStatGroup[] => {
    const arrDelayed = sensorCount(store.entity(ft.arrivalsDelayed))
    const depDelayed = sensorCount(store.entity(ft.departuresDelayed))
    const arrAvg = sensorCount(store.entity(ft.arrivalsDelayAverage))
    const depAvg = sensorCount(store.entity(ft.departuresDelayAverage))
    const entered = ft.enteredArea ? sensorCount(store.entity(ft.enteredArea)) : null

    const areaStats: FlightStatItem[] = [
      {
        id: 'overhead',
        label: 'Overhead now',
        value: overhead.length,
        tone: overheadTone(overhead.length),
      },
    ]

    if (ft.enteredArea) {
      areaStats.push({
        id: 'entered',
        label: 'Entered today',
        value: statDisplayValue(entered),
        tone: 'neutral' as const,
      })
    }

    return [
      {
        id: 'area',
        title: 'Tracking area',
        symbol: '✈',
        stats: areaStats,
      },
      {
        id: 'arrivals',
        title: 'Arrivals',
        symbol: '↓',
        stats: [
          {
            id: 'arr-delayed',
            label: 'Delayed flights',
            value: statDisplayValue(arrDelayed),
            tone: delayCountTone(arrDelayed),
          },
          {
            id: 'arr-avg',
            label: 'Average delay',
            value: statDisplayValue(arrAvg),
            unit: 'min',
            tone: delayMinutesTone(arrAvg),
          },
        ],
      },
      {
        id: 'departures',
        title: 'Departures',
        symbol: '↑',
        stats: [
          {
            id: 'dep-delayed',
            label: 'Delayed flights',
            value: statDisplayValue(depDelayed),
            tone: delayCountTone(depDelayed),
          },
          {
            id: 'dep-avg',
            label: 'Average delay',
            value: statDisplayValue(depAvg),
            unit: 'min',
            tone: delayMinutesTone(depAvg),
          },
        ],
      },
    ]
  })
</script>

<div class="flight-page">
  <ConnectionBanner status={store.status} error={store.error} />

  <header class="flight-page-header panel">
    <div class="flight-page-header-main">
      <p class="flight-page-eyebrow">Flight tracker</p>
      <h1 class="flight-page-airport">{airportCode}</h1>
    </div>
    <ClockHeader compact />
  </header>

  <FlightStats groups={statGroups} />

  <section class="flight-radar">
    <div class="flight-radar-map">
      <FlightMap flights={overhead} center={mapCenter} layout="sidebar" {airportCode} />
    </div>

    <aside class="flight-radar-overhead panel">
      <header class="flight-radar-overhead-header">
        <h2 class="section-label">
          Overhead now
          {#if overheadLive}
            <span class="flight-live-dot" aria-hidden="true"></span>
          {/if}
        </h2>
      </header>

      {#if overhead.length === 0}
        <p class="flight-overhead-empty" in:fade={{ duration: 200 }}>No aircraft in the tracking area</p>
      {:else}
        <div class="flight-radar-list">
          {#each overhead as flight (flight.id)}
            <div
              class="flight-radar-item"
              class:flight-item-fresh={overheadFresh.freshIds.has(flight.id)}
              animate:flip={{ duration: 320 }}
              in:fly={{ y: 12, duration: 240 }}
              out:fade={{ duration: 160 }}
            >
              <FlightOverheadCard {flight} {airportCode} compact />
            </div>
          {/each}
        </div>
      {/if}
    </aside>
  </section>

  <div class="flight-boards">
    <FlightBoard
      title="Arrivals"
      kind="arrival"
      flights={arrivals}
      totalFlights={arrivalsAll.length}
      airlineCounts={arrivalAirlines}
      isFresh={(id) => arrivalsFresh.freshIds.has(id)}
      emptyText="No upcoming arrivals"
    />
    <FlightBoard
      title="Departures"
      kind="departure"
      flights={departures}
      totalFlights={departuresAll.length}
      airlineCounts={departureAirlines}
      isFresh={(id) => departuresFresh.freshIds.has(id)}
      emptyText="No upcoming departures"
    />
  </div>
</div>

<style>
  .flight-page {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1rem 1rem 4.5rem;
    padding-top: 1.25rem;
  }

  .flight-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 1rem;
  }

  .flight-page-eyebrow {
    margin: 0;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .flight-page-airport {
    margin: 0.15rem 0 0;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .flight-radar {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 0.85rem;
    align-items: stretch;
    min-height: clamp(14rem, 38vh, 22rem);
  }

  .flight-radar-map {
    min-width: 0;
    min-height: 0;
    display: flex;
  }

  .flight-radar-overhead {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    min-width: 0;
    min-height: 0;
  }

  .flight-radar-overhead-header {
    flex-shrink: 0;
  }

  .flight-radar-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
    min-height: 0;
    flex: 1;
    padding-right: 0.1rem;
  }

  .flight-radar-item {
    border-radius: 0.65rem;
  }

  .flight-overhead-empty {
    margin: 0;
    padding: 1rem 0.5rem;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    flex: 1;
    display: grid;
    place-items: center;
  }

  .flight-boards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
    flex: 1;
    min-height: 0;
  }

  @media (max-width: 900px) {
    .flight-radar {
      grid-template-columns: 1fr;
      min-height: 0;
    }

    .flight-radar-map {
      min-height: clamp(11rem, 34vw, 15rem);
    }

    .flight-radar-list {
      max-height: none;
    }

    .flight-boards {
      grid-template-columns: 1fr;
    }

    .flight-page-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
