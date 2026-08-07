<script lang="ts">
  import ConnectionBanner from '../components/ConnectionBanner.svelte'
  import ClockHeader from '../components/ClockHeader.svelte'
  import FlightBoard from '../components/flights/FlightBoard.svelte'
  import FlightMap from '../components/flights/FlightMap.svelte'
  import FlightLiveCarousel from '../components/flights/FlightLiveCarousel.svelte'
  import FlightOpsStrip from '../components/flights/FlightOpsStrip.svelte'
  import FlightStats from '../components/flights/FlightStats.svelte'
  import { entityConfig } from '../lib/config/types'
  import type { FlightOpsItem, FlightStatGroup, FlightStatItem } from '../lib/flights/types'
  import {
    delayCountTone,
    delayIndexTone,
    delayMinutesTone,
    entityLastUpdated,
    formatDataFreshness,
    formatDelayIndex,
    overheadTone,
    countBoardFlightsByAirline,
    countAirbusBoeingFlights,
    enrichBoardFlightsFromOverhead,
    formatAirbusBoeingMix,
    parseBoardFlights,
    parseOverheadFlights,
    sensorCount,
    sensorFloat,
    sortBoardFlights,
    sortOverheadByAirportRole,
    statDisplayValue,
  } from '../lib/flights/utils'
  import { createFreshIdTracker } from '../lib/flights/freshIds.svelte'
  import { useEntityStore } from '../lib/ha/useEntityStore.svelte'
  import { isEntityAvailable } from '../lib/ha/utils'

  const store = useEntityStore()
  const ft = entityConfig.flightTracker
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
    enrichBoardFlightsFromOverhead(
      sortBoardFlights(
        parseBoardFlights(store.entity(ft.airportArrivals), { limit: null }),
        'arrival',
      ),
      overhead,
    ),
  )
  const departuresAll = $derived(
    enrichBoardFlightsFromOverhead(
      sortBoardFlights(
        parseBoardFlights(store.entity(ft.airportDepartures), { limit: null }),
        'departure',
      ),
      overhead,
    ),
  )
  const arrivals = $derived(arrivalsAll.slice(0, 24))
  const departures = $derived(departuresAll.slice(0, 24))
  const arrivalAirlines = $derived(countBoardFlightsByAirline(arrivalsAll))
  const departureAirlines = $derived(countBoardFlightsByAirline(departuresAll))
  const manufacturerCounts = $derived(countAirbusBoeingFlights(arrivalsAll, departuresAll))

  const carouselLive = $derived(
    overheadLive ||
      arrivals.some((flight) => arrivalsFresh.freshIds.has(flight.id)) ||
      departures.some((flight) => departuresFresh.freshIds.has(flight.id)),
  )

  $effect(() => {
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
    const entered = ft.enteredArea ? sensorCount(store.entity(ft.enteredArea)) : null

    const areaStats: FlightStatItem[] = [
      {
        id: 'overhead',
        label: 'Overhead',
        value: overhead.length,
        tone: overheadTone(overhead.length),
      },
    ]

    if (ft.enteredArea) {
      areaStats.push({
        id: 'entered',
        label: 'Entered',
        value: statDisplayValue(entered),
        tone: 'neutral' as const,
      })
    }

    return [
      {
        id: 'live',
        title: 'Live',
        symbol: '◎',
        stats: areaStats,
      },
    ]
  })

  const opsItems = $derived.by((): FlightOpsItem[] => {
    const arrDelayed = sensorCount(store.entity(ft.arrivalsDelayed))
    const depDelayed = sensorCount(store.entity(ft.departuresDelayed))
    const arrAvg = sensorCount(store.entity(ft.arrivalsDelayAverage))
    const depAvg = sensorCount(store.entity(ft.departuresDelayAverage))
    const arrOnTime = ft.arrivalsOnTime ? sensorCount(store.entity(ft.arrivalsOnTime)) : null
    const depOnTime = ft.departuresOnTime ? sensorCount(store.entity(ft.departuresOnTime)) : null
    const arrCanceled = ft.arrivalsCanceled ? sensorCount(store.entity(ft.arrivalsCanceled)) : null
    const depCanceled = ft.departuresCanceled ? sensorCount(store.entity(ft.departuresCanceled)) : null
    const arrIndex = ft.arrivalsDelayIndex ? sensorFloat(store.entity(ft.arrivalsDelayIndex)) : null
    const depIndex = ft.departuresDelayIndex ? sensorFloat(store.entity(ft.departuresDelayIndex)) : null

    const items: FlightOpsItem[] = [
      {
        id: 'oem-mix',
        label: 'Airbus / Boeing',
        value: formatAirbusBoeingMix(manufacturerCounts),
        tone: 'accent',
      },
      {
        id: 'arr-index',
        label: 'Arr index',
        value: formatDelayIndex(arrIndex),
        tone: delayIndexTone(arrIndex),
      },
      {
        id: 'dep-index',
        label: 'Dep index',
        value: formatDelayIndex(depIndex),
        tone: delayIndexTone(depIndex),
      },
      {
        id: 'arr-delayed',
        label: 'Arr delayed',
        value: String(statDisplayValue(arrDelayed)),
        tone: delayCountTone(arrDelayed),
      },
      {
        id: 'dep-delayed',
        label: 'Dep delayed',
        value: String(statDisplayValue(depDelayed)),
        tone: delayCountTone(depDelayed),
      },
      {
        id: 'arr-avg',
        label: 'Arr avg',
        value: arrAvg == null ? '—' : `${arrAvg}m`,
        tone: delayMinutesTone(arrAvg),
      },
      {
        id: 'dep-avg',
        label: 'Dep avg',
        value: depAvg == null ? '—' : `${depAvg}m`,
        tone: delayMinutesTone(depAvg),
      },
    ]

    if (ft.arrivalsOnTime || ft.departuresOnTime) {
      items.push({
        id: 'on-time',
        label: 'On time',
        value:
          arrOnTime != null && depOnTime != null
            ? `${arrOnTime}/${depOnTime}`
            : String(statDisplayValue(arrOnTime ?? depOnTime)),
        tone: 'good',
      })
    }

    if (ft.arrivalsCanceled || ft.departuresCanceled) {
      const canceledTotal = (arrCanceled ?? 0) + (depCanceled ?? 0)
      const hasData = arrCanceled != null || depCanceled != null
      items.push({
        id: 'canceled',
        label: 'Canceled',
        value: hasData ? String(canceledTotal) : '—',
        tone: canceledTotal > 0 ? 'danger' : 'good',
      })
    }

    return items
  })

  const opsUpdated = $derived(
    formatDataFreshness(
      entityLastUpdated(store.entity(ft.airportArrivals)) ??
        entityLastUpdated(store.entity(ft.airportDepartures)),
    ),
  )
</script>

<div class="flight-page">
  <ConnectionBanner status={store.status} error={store.error} />

  <header class="flight-page-header panel">
    <div class="flight-page-header-main">
      <h1 class="flight-page-airport">{airportCode}</h1>
      <FlightStats groups={statGroups} />
    </div>
    <ClockHeader compact />
  </header>

  <FlightOpsStrip items={opsItems} updated={opsUpdated} />

  <section class="flight-live" aria-labelledby="flight-live-heading">
    <h2 id="flight-live-heading" class="flight-section-heading">
      <span class="flight-section-symbol" aria-hidden="true">◎</span>
      Live
      {#if overheadLive}
        <span class="flight-live-dot" aria-hidden="true"></span>
      {/if}
    </h2>

    <div class="flight-radar">
      <aside class="flight-radar-overhead panel">
        <FlightLiveCarousel
          arrivals={arrivalsAll}
          departures={departuresAll}
          {overhead}
          {airportCode}
          live={carouselLive}
          {overheadLive}
          isFresh={(id) =>
            arrivalsFresh.freshIds.has(id) || departuresFresh.freshIds.has(id)}
        />
      </aside>

      <div class="flight-radar-map">
        <FlightMap flights={overhead} center={mapCenter} layout="sidebar" {airportCode} />
      </div>
    </div>
  </section>

  <section class="flight-schedule" aria-labelledby="flight-schedule-heading">
    <h2 id="flight-schedule-heading" class="flight-section-heading">
      <span class="flight-section-symbol" aria-hidden="true">▤</span>
      Schedule
    </h2>

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
  </section>
</div>

<style>
  .flight-page {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.55rem 0.65rem 3.5rem;
    padding-top: 0.75rem;
  }

  .flight-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    padding: 0.45rem 0.6rem;
  }

  .flight-page-header-main {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    flex: 1;
  }

  .flight-page-airport {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1;
  }

  .flight-section-heading {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    padding: 0 0.1rem;
  }

  .flight-section-symbol {
    display: inline-grid;
    place-items: center;
    width: 0.95rem;
    height: 0.95rem;
    border-radius: 0.25rem;
    font-size: 0.5625rem;
    font-weight: 700;
    background: color-mix(in srgb, var(--color-accent) 14%, transparent);
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .flight-live,
  .flight-schedule {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-height: 0;
  }

  .flight-schedule {
    flex: 1;
  }

  .flight-radar {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    gap: 0.4rem;
    align-items: stretch;
    min-height: clamp(14rem, 36vh, 20rem);
  }

  .flight-radar-map {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .flight-radar-overhead {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .flight-boards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.4rem;
    flex: 1;
    min-height: 0;
  }

  @media (max-width: 900px) {
    .flight-radar {
      grid-template-columns: 1fr;
      min-height: 0;
    }

    .flight-radar-overhead {
      min-height: clamp(14rem, 40vh, 20rem);
    }

    .flight-radar-map {
      min-height: clamp(9rem, 28vw, 12rem);
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
