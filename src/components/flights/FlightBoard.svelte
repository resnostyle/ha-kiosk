<script lang="ts">
  import { fade, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import type { BoardAirlineCount, BoardFlight, BoardKind } from '../../lib/flights/types'
  import {
    airlineLogoUrl,
    boardActualTime,
    boardDelayInfo,
    boardScheduledTime,
    boardStatusDisplay,
    flightStatToneToBadgeClass,
    statusClass,
  } from '../../lib/flights/utils'
  import AirlineMark from './AirlineMark.svelte'
  import AnimatedFlightValue from './AnimatedFlightValue.svelte'

  interface Props {
    title: string
    kind: BoardKind
    flights: BoardFlight[]
    totalFlights?: number
    airlineCounts?: BoardAirlineCount[]
    isFresh?: (id: string) => boolean
    emptyText?: string
  }

  let {
    title,
    kind,
    flights,
    totalFlights,
    airlineCounts = [],
    isFresh = () => false,
    emptyText = 'No upcoming flights',
  }: Props = $props()

  const headerCount = $derived(totalFlights ?? flights.length)
  const showingSubset = $derived(headerCount > flights.length)
  const routeHeading = $derived(kind === 'arrival' ? 'From' : 'To')
  const estHeading = $derived(kind === 'arrival' ? 'Est arr' : 'Est dep')

  function airlineCode(row: BoardAirlineCount): string {
    if (row.airlineIata) return row.airlineIata
    const word = row.airline.trim().split(/\s+/)[0] ?? row.airline
    return word.slice(0, 3).toUpperCase()
  }

  function aircraftSuffix(flight: BoardFlight): string {
    return flight.aircraftModel ? ` · ${flight.aircraftModel}` : ''
  }
</script>

<section class="flight-board panel">
  <header class="flight-board-header">
    <div class="flight-board-header-main">
      <h2 class="section-label">{title}</h2>
      {#if headerCount > 0}
        <p class="flight-board-subtitle">
          {headerCount} flight{headerCount === 1 ? '' : 's'}
          {#if showingSubset}
            <span class="flight-board-subtitle-note">· showing {flights.length}</span>
          {/if}
        </p>
      {/if}
    </div>
    {#if headerCount > 0}
      <span class="flight-board-total" aria-hidden="true">
        <AnimatedFlightValue value={headerCount} />
      </span>
    {/if}
  </header>

  {#if airlineCounts.length > 0}
    <div class="flight-board-breakdown">
      <h3 class="flight-board-breakdown-label">Airlines</h3>
      <ul class="flight-board-breakdown-grid">
        {#each airlineCounts as row (row.key)}
          {@const code = airlineCode(row)}
          {@const logo = airlineLogoUrl(row.airlineIata)}
          <li
            class="flight-board-breakdown-item"
            title="{row.airline} · {row.count}"
            animate:flip={{ duration: 300 }}
            in:fly={{ y: 8, duration: 200 }}
            out:fade={{ duration: 140 }}
          >
            <span class="flight-board-breakdown-logo" aria-hidden="true">
              {#if logo}
                <img src={logo} alt="" loading="lazy" />
              {:else}
                <span class="flight-board-breakdown-fallback">{code}</span>
              {/if}
            </span>
            <span class="flight-board-breakdown-code">{code}</span>
            <span class="flight-board-breakdown-count">
              <AnimatedFlightValue value={row.count} />
            </span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if flights.length === 0}
    <p class="flight-board-empty" in:fade={{ duration: 200 }}>{emptyText}</p>
  {:else}
    <div class="flight-board-table" role="table" aria-label="{title}">
      <div class="flight-board-columns" role="row">
        <span class="flight-board-col flight-board-col-flight" role="columnheader">Flight</span>
        <span class="flight-board-col flight-board-col-route" role="columnheader">{routeHeading}</span>
        <span class="flight-board-col flight-board-col-sched" role="columnheader">Sched</span>
        <span class="flight-board-col flight-board-col-est" role="columnheader">{estHeading}</span>
        <span class="flight-board-col flight-board-col-status" role="columnheader">Status</span>
      </div>

      <ul class="flight-board-list">
        {#each flights as flight (flight.id)}
          {@const scheduled = boardScheduledTime(flight, kind)}
          {@const estimated = boardActualTime(flight, kind)}
          {@const delay = boardDelayInfo(flight, kind)}
          <li
            class="flight-board-row"
            class:flight-item-fresh={isFresh(flight.id)}
            role="row"
            animate:flip={{ duration: 280 }}
            in:fly={{ x: -10, duration: 220 }}
            out:fade={{ duration: 150 }}
          >
            <div class="flight-board-main flight-board-col-flight" role="cell">
              <span class="flight-board-flight">{flight.flightNumber}</span>
              <AirlineMark
                name={flight.airline}
                iata={flight.airlineIata}
                suffix={aircraftSuffix(flight)}
              />
            </div>

            <div class="flight-board-route flight-board-col-route" role="cell">
              <span class="flight-board-airport">{flight.airportCode}</span>
              <span class="flight-board-city">{flight.airport}</span>
            </div>

            <span class="flight-board-time flight-board-col-sched" role="cell">
              {scheduled ?? '—'}
            </span>

            <span
              class="flight-board-time flight-board-col-est"
              class:flight-board-time-estimated={estimated != null}
              role="cell"
            >
              {estimated ?? '—'}
            </span>

            <div class="flight-board-status-cell flight-board-col-status" role="cell">
              {#if delay}
                <span class={flightStatToneToBadgeClass(delay.tone)}>{delay.label}</span>
              {/if}
              <span class="flight-board-status {statusClass(flight.status)}">
                {boardStatusDisplay(flight, kind)}
              </span>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<style>
  .flight-board {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0.75rem;
    height: 100%;
    gap: 0.65rem;
  }

  .flight-board-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .flight-board-header-main {
    min-width: 0;
  }

  .flight-board-subtitle {
    margin: 0.2rem 0 0;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    line-height: 1.3;
  }

  .flight-board-subtitle-note {
    color: color-mix(in srgb, var(--color-text-muted) 85%, var(--color-text));
  }

  .flight-board-total {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: color-mix(in srgb, var(--color-text-muted) 55%, var(--color-text));
    flex-shrink: 0;
  }

  .flight-board-breakdown {
    flex-shrink: 0;
    padding: 0.6rem 0.65rem;
    border-radius: 0.65rem;
    background: var(--color-surface-overlay);
    border: 1px solid color-mix(in srgb, var(--color-border) 75%, transparent);
  }

  .flight-board-breakdown-label {
    margin: 0 0 0.5rem;
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .flight-board-breakdown-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(3.5rem, 1fr));
    gap: 0.35rem;
  }

  .flight-board-breakdown-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.45rem 0.25rem 0.4rem;
    border-radius: 0.5rem;
    min-width: 0;
    text-align: center;
  }

  .flight-board-breakdown-logo {
    display: grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
  }

  .flight-board-breakdown-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 0.2rem;
    background: #fff;
    padding: 0.1rem;
  }

  .flight-board-breakdown-fallback {
    display: grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    background: color-mix(in srgb, var(--color-border) 60%, transparent);
    color: var(--color-text-muted);
  }

  .flight-board-breakdown-code {
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    line-height: 1;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .flight-board-breakdown-count {
    font-size: 0.9375rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--color-text);
  }

  .flight-board-empty {
    margin: auto;
    font-size: 0.875rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .flight-board-table {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    border-top: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  }

  .flight-board-columns,
  .flight-board-row {
    display: grid;
    grid-template-columns: minmax(5.5rem, 1.35fr) minmax(3.5rem, 1fr) 3.25rem 3.25rem minmax(4.5rem, auto);
    gap: 0.4rem 0.5rem;
    align-items: center;
  }

  .flight-board-columns {
    padding: 0.45rem 0.45rem 0.35rem;
    flex-shrink: 0;
  }

  .flight-board-col {
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    min-width: 0;
  }

  .flight-board-col-status {
    text-align: right;
  }

  .flight-board-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    min-height: 0;
    flex: 1;
  }

  .flight-board-row {
    padding: 0.65rem 0.45rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
    border-radius: 0.45rem;
  }

  .flight-board-row:last-child {
    border-bottom: none;
  }

  .flight-board-main {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .flight-board-flight {
    font-weight: 700;
    font-size: 0.875rem;
  }

  .flight-board-main :global(.airline-mark) {
    margin: 0;
    font-size: 0.6875rem;
  }

  .flight-board-route {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .flight-board-airport {
    font-weight: 600;
    font-size: 0.8125rem;
  }

  .flight-board-city {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .flight-board-time {
    font-size: 0.75rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .flight-board-time-estimated {
    color: var(--color-accent);
  }

  .flight-board-status-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
    min-width: 0;
  }

  .flight-board-status {
    text-align: right;
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .flight-board .flight-status-delayed {
    color: var(--color-warning);
  }

  .flight-board .flight-status-estimated {
    color: var(--color-accent);
  }

  .flight-board .flight-status-scheduled {
    color: var(--color-text-muted);
  }

  .flight-board .flight-status-landed {
    color: var(--color-success);
  }

  .flight-board .flight-status-default {
    color: var(--color-text);
  }

  @media (max-width: 900px) {
    .flight-board-columns,
    .flight-board-row {
      grid-template-columns: minmax(4.5rem, 1.2fr) minmax(2.5rem, 0.9fr) 2.75rem 2.75rem minmax(3.5rem, auto);
      gap: 0.35rem;
    }

    .flight-board-time {
      font-size: 0.6875rem;
    }
  }
</style>
