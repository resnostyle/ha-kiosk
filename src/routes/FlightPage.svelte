<script lang="ts">
  import ConnectionBanner from '../components/ConnectionBanner.svelte'
  import ClockHeader from '../components/ClockHeader.svelte'
  import FlightBoard from '../components/flights/FlightBoard.svelte'
  import FlightMap from '../components/flights/FlightMap.svelte'
  import FlightCarousel, {
    type FlightCarouselSlide,
  } from '../components/flights/OverheadCarousel.svelte'
  import FlightStats from '../components/flights/FlightStats.svelte'
  import { entityConfig } from '../lib/config/types'
  import {
    delayCountTone,
    delayMinutesTone,
    overheadTone,
    countBoardFlightsByAirline,
    enrichBoardFlightsFromOverhead,
    parseBoardFlights,
    parseOverheadFlights,
    sensorCount,
    sortBoardFlights,
    sortOverheadByAirportRole,
    statDisplayValue,
    topDelayedBoardFlights,
  } from '../lib/flights/utils'
  import type { FlightStatGroup, FlightStatItem } from '../lib/flights/types'
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

  const carouselSlides = $derived.by((): FlightCarouselSlide[] => {
    const hub = airportCode === '—' ? 'airport' : airportCode
    const slides: FlightCarouselSlide[] = []

    if (overhead.length > 0) {
      slides.push({
        id: 'overhead',
        title: `Overhead · ${overhead.length}`,
        symbol: '◎',
        emptyText: 'No aircraft overhead',
        overheadFlights: overhead.slice(0, 6),
      })
    }

    slides.push(
      {
        id: 'departures',
        title: `Departing ${hub}`,
        symbol: '↑',
        emptyText: 'No upcoming departures',
        boardFlights: departuresAll
          .slice(0, 6)
          .map((flight) => ({ flight, kind: 'departure' as const })),
      },
      {
        id: 'arrivals',
        title: `Arriving ${hub}`,
        symbol: '↓',
        emptyText: 'No upcoming arrivals',
        boardFlights: arrivalsAll
          .slice(0, 6)
          .map((flight) => ({ flight, kind: 'arrival' as const })),
      },
      {
        id: 'delayed',
        title: 'Most delayed',
        symbol: '⏱',
        emptyText: 'No delayed flights right now',
        delayedFlights: topDelayedBoardFlights(arrivalsAll, departuresAll, 6),
      },
    )

    return slides
  })

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
    const arrDelayed = sensorCount(store.entity(ft.arrivalsDelayed))
    const depDelayed = sensorCount(store.entity(ft.departuresDelayed))
    const arrAvg = sensorCount(store.entity(ft.arrivalsDelayAverage))
    const depAvg = sensorCount(store.entity(ft.departuresDelayAverage))
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
        id: 'area',
        title: 'Area',
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
            label: 'Arr delayed',
            value: statDisplayValue(arrDelayed),
            tone: delayCountTone(arrDelayed),
          },
          {
            id: 'arr-avg',
            label: 'Arr avg',
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
            label: 'Dep delayed',
            value: statDisplayValue(depDelayed),
            tone: delayCountTone(depDelayed),
          },
          {
            id: 'dep-avg',
            label: 'Dep avg',
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
      <h1 class="flight-page-airport">{airportCode}</h1>
      <FlightStats groups={statGroups} />
    </div>
    <ClockHeader compact />
  </header>

  <section class="flight-radar">
    <div class="flight-radar-map">
      <FlightMap flights={overhead} center={mapCenter} layout="sidebar" {airportCode} />
    </div>

    <aside class="flight-radar-overhead panel">
      <FlightCarousel
        slides={carouselSlides}
        live={carouselLive}
        {airportCode}
        isFresh={(id) =>
          arrivalsFresh.freshIds.has(id) || departuresFresh.freshIds.has(id)}
      />
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

  .flight-radar {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    gap: 0.4rem;
    align-items: stretch;
    min-height: clamp(12rem, 32vh, 18rem);
  }

  .flight-radar-map {
    min-width: 0;
    min-height: 0;
    display: flex;
  }

  .flight-radar-overhead {
    display: flex;
    flex-direction: column;
    padding: 0.4rem;
    min-width: 0;
    min-height: 0;
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
