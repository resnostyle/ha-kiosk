<script lang="ts">
  import type { BoardFlight, BoardKind, InterestingBoardFlight, OverheadFlight } from '../../lib/flights/types'
  import type { DelayedBoardFlight } from '../../lib/flights/utils'
  import FlightBoardHighlight from './FlightBoardHighlight.svelte'
  import FlightOverheadCard from './FlightOverheadCard.svelte'

  export interface BoardCarouselFlight {
    flight: BoardFlight
    kind: BoardKind
  }

  export interface FlightCarouselSlide {
    id: string
    title: string
    symbol: string
    emptyText: string
    boardFlights?: BoardCarouselFlight[]
    delayedFlights?: DelayedBoardFlight[]
    interestingFlights?: InterestingBoardFlight[]
    overheadFlights?: OverheadFlight[]
  }

  interface Props {
    slides: FlightCarouselSlide[]
    live?: boolean
    isFresh?: (id: string) => boolean
    airportCode?: string | null
    cycleSeconds?: number
  }

  let {
    slides,
    live = false,
    isFresh = () => false,
    airportCode = null,
    cycleSeconds = 8,
  }: Props = $props()

  let index = $state(0)

  const activeSlides = $derived(slides.length > 0 ? slides : [])
  const current = $derived(activeSlides[index] ?? null)

  function goTo(next: number) {
    if (activeSlides.length === 0) return
    index = ((next % activeSlides.length) + activeSlides.length) % activeSlides.length
  }

  $effect(() => {
    if (activeSlides.length <= 1) return

    const count = activeSlides.length
    const id = setInterval(() => {
      index = (index + 1) % count
    }, cycleSeconds * 1000)

    return () => clearInterval(id)
  })

  $effect(() => {
    if (index >= activeSlides.length) {
      index = 0
    }
  })
</script>

<section class="flight-carousel" aria-label="Flight highlights">
  <header class="flight-carousel-header">
    {#if current}
      <h2 class="flight-carousel-title">
        <span class="flight-carousel-symbol" aria-hidden="true">{current.symbol}</span>
        {current.title}
        {#if live}
          <span class="flight-live-dot" aria-hidden="true"></span>
        {/if}
      </h2>
    {/if}

    {#if activeSlides.length > 1}
      <div class="flight-carousel-dots" role="tablist" aria-label="Carousel slides">
        {#each activeSlides as slide, slideIndex (slide.id)}
          <button
            type="button"
            class="flight-carousel-dot"
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

  {#if activeSlides.length === 0}
    <p class="flight-carousel-empty">No flights to show</p>
  {:else}
    <div class="flight-carousel-viewport">
      <div class="flight-carousel-track" style:transform="translateX(-{index * 100}%)">
        {#each activeSlides as slide (slide.id)}
          <div class="flight-carousel-slide" aria-hidden={slide.id !== current?.id}>
            {#if slide.boardFlights}
              {#if slide.boardFlights.length === 0}
                <p class="flight-carousel-empty">{slide.emptyText}</p>
              {:else}
                <div class="flight-carousel-list">
                  {#each slide.boardFlights as entry (entry.flight.id)}
                    <div
                      class="flight-carousel-item"
                      class:flight-item-fresh={isFresh(entry.flight.id)}
                    >
                      <FlightBoardHighlight flight={entry.flight} kind={entry.kind} />
                    </div>
                  {/each}
                </div>
              {/if}
            {:else if slide.overheadFlights}
              {#if slide.overheadFlights.length === 0}
                <p class="flight-carousel-empty">{slide.emptyText}</p>
              {:else}
                <div class="flight-carousel-list">
                  {#each slide.overheadFlights as flight (flight.id)}
                    <div class="flight-carousel-item">
                      <FlightOverheadCard {flight} {airportCode} compact />
                    </div>
                  {/each}
                </div>
              {/if}
            {:else if slide.interestingFlights}
              {#if slide.interestingFlights.length === 0}
                <p class="flight-carousel-empty">{slide.emptyText}</p>
              {:else}
                <div class="flight-carousel-list">
                  {#each slide.interestingFlights as entry (entry.flight.id + entry.kind)}
                    <div
                      class="flight-carousel-item"
                      class:flight-item-fresh={isFresh(entry.flight.id)}
                    >
                      <FlightBoardHighlight
                        flight={entry.flight}
                        kind={entry.kind}
                        reason={entry.reason}
                      />
                    </div>
                  {/each}
                </div>
              {/if}
            {:else if slide.delayedFlights}
              {#if slide.delayedFlights.length === 0}
                <p class="flight-carousel-empty">{slide.emptyText}</p>
              {:else}
                <div class="flight-carousel-list">
                  {#each slide.delayedFlights as entry (entry.flight.id + entry.kind)}
                    <div class="flight-carousel-item">
                      <FlightBoardHighlight
                        flight={entry.flight}
                        kind={entry.kind}
                        delayMinutes={entry.delayMinutes}
                      />
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .flight-carousel {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-height: 0;
    flex: 1;
  }

  .flight-carousel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .flight-carousel-title {
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

  .flight-carousel-symbol {
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

  .flight-carousel-dots {
    display: inline-flex;
    gap: 0.3rem;
    flex-shrink: 0;
    padding-top: 0.15rem;
  }

  .flight-carousel-dot {
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

  .flight-carousel-dot.active {
    background: var(--color-accent);
    transform: scale(1.2);
  }

  .flight-carousel-viewport {
    position: relative;
    overflow: hidden;
    min-height: 0;
    flex: 1;
  }

  .flight-carousel-track {
    display: flex;
    height: 100%;
    transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .flight-carousel-slide {
    flex: 0 0 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .flight-carousel-list {
    display: flex;
    flex-direction: column;
    gap: 0.22rem;
    overflow-y: auto;
    min-height: 0;
    flex: 1;
    padding-right: 0.05rem;
  }

  .flight-carousel-item {
    border-radius: 0.5rem;
    flex-shrink: 0;
  }

  .flight-carousel-empty {
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
    .flight-carousel-track {
      transition: none;
    }
  }
</style>
