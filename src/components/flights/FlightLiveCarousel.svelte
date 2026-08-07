<script lang="ts">
  import type { BoardFlight, OverheadFlight } from '../../lib/flights/types'
  import { buildSpotlightCandidates, rotatingSpotlightPair } from '../../lib/flights/utils'
  import FlightBoardHighlight from './FlightBoardHighlight.svelte'
  import FlightOverheadCard from './FlightOverheadCard.svelte'
  import FlightSpotlightCard from './FlightSpotlightCard.svelte'

  type Slide =
    | { id: 'spotlight'; title: string; symbol: string }
    | { id: 'arrivals'; title: string; symbol: string }
    | { id: 'departures'; title: string; symbol: string }
    | { id: 'overhead'; title: string; symbol: string }

  interface Props {
    arrivals: BoardFlight[]
    departures: BoardFlight[]
    overhead: OverheadFlight[]
    airportCode?: string | null
    live?: boolean
    overheadLive?: boolean
    isFresh?: (id: string) => boolean
    listLimit?: number
    cycleSeconds?: number
  }

  let {
    arrivals,
    departures,
    overhead,
    airportCode = null,
    live = false,
    overheadLive = false,
    isFresh = () => false,
    listLimit = 6,
    cycleSeconds = 8,
  }: Props = $props()

  let index = $state(0)
  let pairIndex = $state(0)
  let lastSpotlightVisit = $state(-1)

  const hub = $derived(airportCode === '—' ? 'airport' : (airportCode ?? 'airport'))
  const candidates = $derived(buildSpotlightCandidates(arrivals, departures, overhead))
  const spotlight = $derived(rotatingSpotlightPair(candidates, pairIndex))
  const spotlightIsPair = $derived(Boolean(spotlight.arrival && spotlight.departure))
  const arrivalList = $derived(arrivals.slice(0, listLimit))
  const departureList = $derived(departures.slice(0, listLimit))
  const overheadList = $derived(overhead.slice(0, listLimit))

  const slides = $derived.by((): Slide[] => [
    { id: 'spotlight', title: 'Spotlight', symbol: '★' },
    { id: 'arrivals', title: `Arriving ${hub}`, symbol: '↓' },
    { id: 'departures', title: `Departing ${hub}`, symbol: '↑' },
    { id: 'overhead', title: `Overhead · ${overhead.length}`, symbol: '◎' },
  ])

  const current = $derived(slides[index] ?? null)
  const showLiveDot = $derived(
    live && (current?.id === 'spotlight' || current?.id === 'arrivals' || current?.id === 'departures'),
  )
  const showOverheadDot = $derived(overheadLive && current?.id === 'overhead')

  function goTo(next: number) {
    const count = slides.length
    if (count === 0) return
    index = ((next % count) + count) % count
  }

  $effect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => goTo(index + 1), cycleSeconds * 1000)
    return () => clearInterval(timer)
  })

  $effect(() => {
    if (index >= slides.length) index = 0
  })

  $effect(() => {
    if (current?.id !== 'spotlight' || index === lastSpotlightVisit) return
    if (lastSpotlightVisit >= 0) pairIndex++
    lastSpotlightVisit = index
  })
</script>

<section class="flight-live-carousel" aria-label="Live flight highlights">
  <header class="flight-live-carousel-header">
    {#if current}
      <h2 class="flight-live-carousel-title">
        <span class="flight-live-carousel-symbol" aria-hidden="true">{current.symbol}</span>
        {current.title}
        {#if showLiveDot || showOverheadDot}
          <span class="flight-live-dot" aria-hidden="true"></span>
        {/if}
      </h2>
    {/if}

    {#if slides.length > 1}
      <div class="flight-live-carousel-dots" role="tablist" aria-label="Live views">
        {#each slides as slide, slideIndex (slide.id)}
          <button
            type="button"
            class="flight-live-carousel-dot"
            class:active={slideIndex === index}
            aria-label={slide.title}
            aria-selected={slideIndex === index}
            role="tab"
            onclick={() => goTo(slideIndex)}
          ></button>
        {/each}
      </div>
    {/if}
  </header>

  <div class="flight-live-carousel-viewport">
    <div class="flight-live-carousel-track" style:transform="translateX(-{index * 100}%)">
      {#each slides as slide (slide.id)}
        <div class="flight-live-carousel-slide" aria-hidden={slide.id !== current?.id}>
          {#if slide.id === 'spotlight'}
            {#if !spotlight.arrival && !spotlight.departure}
              <p class="flight-live-carousel-empty">No flights to spotlight right now</p>
            {:else}
              <div
                class="flight-live-carousel-spotlight"
                class:flight-live-carousel-spotlight--pair={spotlightIsPair}
              >
                {#if spotlight.arrival}
                  <FlightSpotlightCard
                    flight={spotlight.arrival}
                    {airportCode}
                    layout={spotlight.departure ? 'column' : 'default'}
                  />
                {/if}
                {#if spotlight.departure}
                  <FlightSpotlightCard
                    flight={spotlight.departure}
                    {airportCode}
                    layout={spotlight.arrival ? 'column' : 'default'}
                  />
                {/if}
              </div>
            {/if}
          {:else if slide.id === 'arrivals'}
            {#if arrivalList.length === 0}
              <p class="flight-live-carousel-empty">No upcoming arrivals</p>
            {:else}
              <ul class="flight-live-carousel-list">
                {#each arrivalList as flight (flight.id)}
                  <li class="flight-live-carousel-item" class:flight-item-fresh={isFresh(flight.id)}>
                    <FlightBoardHighlight flight={flight} kind="arrival" size="large" />
                  </li>
                {/each}
              </ul>
            {/if}
          {:else if slide.id === 'departures'}
            {#if departureList.length === 0}
              <p class="flight-live-carousel-empty">No upcoming departures</p>
            {:else}
              <ul class="flight-live-carousel-list">
                {#each departureList as flight (flight.id)}
                  <li class="flight-live-carousel-item" class:flight-item-fresh={isFresh(flight.id)}>
                    <FlightBoardHighlight flight={flight} kind="departure" size="large" />
                  </li>
                {/each}
              </ul>
            {/if}
          {:else if slide.id === 'overhead'}
            {#if overheadList.length === 0}
              <p class="flight-live-carousel-empty">No aircraft overhead right now</p>
            {:else}
              <ul class="flight-live-carousel-list">
                {#each overheadList as flight (flight.id)}
                  <li class="flight-live-carousel-item">
                    <FlightOverheadCard {flight} {airportCode} compact />
                  </li>
                {/each}
              </ul>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .flight-live-carousel {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-height: 0;
    flex: 1;
    padding: 0.45rem 0.55rem 0.55rem;
  }

  .flight-live-carousel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .flight-live-carousel-title {
    margin: 0;
    min-width: 0;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .flight-live-carousel-symbol {
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

  .flight-live-carousel-dots {
    display: inline-flex;
    gap: 0.3rem;
    flex-shrink: 0;
  }

  .flight-live-carousel-dot {
    width: 0.42rem;
    height: 0.42rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: color-mix(in srgb, var(--color-text-muted) 35%, transparent);
    cursor: pointer;
    transition:
      transform 0.2s ease,
      background 0.2s ease;
  }

  .flight-live-carousel-dot.active {
    background: var(--color-accent);
    transform: scale(1.2);
  }

  .flight-live-carousel-viewport {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .flight-live-carousel-track {
    display: flex;
    height: 100%;
    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .flight-live-carousel-slide {
    flex: 0 0 100%;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .flight-live-carousel-spotlight {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.4rem;
    align-items: stretch;
    min-height: 0;
    flex: 1;
  }

  .flight-live-carousel-spotlight--pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .flight-live-carousel-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.22rem;
    overflow-y: auto;
    min-height: 0;
    flex: 1;
  }

  .flight-live-carousel-item {
    flex-shrink: 0;
    min-width: 0;
  }

  .flight-live-carousel-empty {
    margin: 0;
    padding: 0.75rem 0.35rem;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    flex: 1;
    display: grid;
    place-items: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .flight-live-carousel-track {
      transition: none;
    }
  }
</style>
