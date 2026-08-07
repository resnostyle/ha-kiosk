<script lang="ts">
  import { fade, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import type { BoardAirlineCount, BoardFlight, BoardKind } from '../../lib/flights/types'
  import {
    airlineLogoUrl,
    boardDelayInfo,
    boardStatusShort,
    boardTimeDisplay,
    flightStatToneToBadgeClass,
    formatAircraftLabel,
    isActiveBoardFlight,
    statusClass,
  } from '../../lib/flights/utils'
  import AircraftManufacturerTag from './AircraftManufacturerTag.svelte'
  import AircraftThumb from './AircraftThumb.svelte'
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
  const routeHeading = $derived(kind === 'arrival' ? 'From' : 'To')

  function airlineCode(row: BoardAirlineCount): string {
    if (row.airlineIata) return row.airlineIata
    const word = row.airline.trim().split(/\s+/)[0] ?? row.airline
    return word.slice(0, 3).toUpperCase()
  }

  function airlineLabel(flight: BoardFlight): string {
    return flight.airlineIata ?? flight.airline.split(/\s+/)[0]?.slice(0, 3).toUpperCase() ?? '—'
  }
</script>

<section class="flight-board panel">
  <header class="flight-board-header">
    <h2 class="flight-board-title">
      {title}
      {#if headerCount > 0}
        <span class="flight-board-count">{headerCount}</span>
      {/if}
    </h2>
  </header>

  {#if airlineCounts.length > 0}
    <ul class="flight-board-airlines" aria-label="Airlines">
      {#each airlineCounts as row (row.key)}
        {@const code = airlineCode(row)}
        {@const logo = airlineLogoUrl(row.airlineIata)}
        <li
          class="flight-board-airline"
          title="{row.airline} · {row.count}"
          animate:flip={{ duration: 300 }}
          in:fly={{ y: 6, duration: 180 }}
          out:fade={{ duration: 120 }}
        >
          {#if logo}
            <img class="flight-board-airline-logo" src={logo} alt="" loading="lazy" />
          {:else}
            <span class="flight-board-airline-fallback">{code}</span>
          {/if}
          <span class="flight-board-airline-count">
            <AnimatedFlightValue value={row.count} />
          </span>
        </li>
      {/each}
    </ul>
  {/if}

  {#if flights.length === 0}
    <p class="flight-board-empty" in:fade={{ duration: 200 }}>{emptyText}</p>
  {:else}
    <div class="flight-board-table" role="table" aria-label="{title}">
      <div class="flight-board-columns" role="row">
        <span class="flight-board-col flight-board-col-thumb" role="columnheader" aria-hidden="true"></span>
        <span class="flight-board-col flight-board-col-flight" role="columnheader">Flight</span>
        <span class="flight-board-col flight-board-col-route" role="columnheader">{routeHeading}</span>
        <span class="flight-board-col flight-board-col-time" role="columnheader">Time</span>
        <span class="flight-board-col flight-board-col-status" role="columnheader">Status</span>
      </div>

      <ul class="flight-board-list">
        {#each flights as flight, flightIndex (flight.id)}
          {@const delay = boardDelayInfo(flight, kind)}
          {@const statusShort = boardStatusShort(flight, kind)}
          {@const active = isActiveBoardFlight(flight, kind)}
          {@const lead = flightIndex < 2}
          <li
            class="flight-board-row"
            class:flight-board-row--active={active}
            class:flight-board-row--lead={lead}
            class:flight-item-fresh={isFresh(flight.id)}
            data-kind={kind}
            role="row"
            animate:flip={{ duration: 280 }}
            in:fly={{ x: -8, duration: 200 }}
            out:fade={{ duration: 140 }}
          >
            <div class="flight-board-col-thumb" role="cell">
              {#if lead || active}
                <AircraftThumb
                  src={flight.photoUrl}
                  label={flight.flightNumber}
                  size={lead ? 'lg' : 'sm'}
                />
              {/if}
            </div>

            <div class="flight-board-col-flight" role="cell">
              <div class="flight-board-flight-line">
                <span class="flight-board-flight">{flight.flightNumber}</span>
                <AircraftManufacturerTag
                  aircraftCode={flight.aircraftCode}
                  aircraftModel={flight.aircraftModel}
                  majorOnly
                />
              </div>
              <span class="flight-board-carrier">{airlineLabel(flight)}</span>
              <span class="flight-board-aircraft">{formatAircraftLabel(flight)}</span>
            </div>

            <div class="flight-board-col-route" role="cell">
              <span class="flight-board-airport">{flight.airportCode}</span>
            </div>

            <span class="flight-board-col-time" role="cell">
              {boardTimeDisplay(flight, kind)}
            </span>

            <div class="flight-board-col-status" role="cell">
              {#if delay}
                <span class={flightStatToneToBadgeClass(delay.tone)}>{delay.label}</span>
              {:else if statusShort}
                <span class="flight-board-status {statusClass(flight.status)}">{statusShort}</span>
              {/if}
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
    padding: 0.35rem 0.4rem 0.4rem;
    height: 100%;
    gap: 0.25rem;
  }

  .flight-board-header {
    flex-shrink: 0;
    padding: 0 0.05rem;
  }

  .flight-board-title {
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .flight-board-count {
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }

  .flight-board-airlines {
    list-style: none;
    margin: 0;
    padding: 0 0 0.2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.22rem;
    flex-shrink: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);
  }

  .flight-board-airline {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    padding: 0.18rem 0.38rem 0.18rem 0.28rem;
    border-radius: 9999px;
    background: var(--color-surface-overlay);
    border: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);
  }

  .flight-board-airline-logo {
    width: 1.25rem;
    height: 1.25rem;
    object-fit: contain;
    border-radius: 0.2rem;
    background: #fff;
    padding: 0.1rem;
  }

  .flight-board-airline-fallback {
    display: grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 0.2rem;
    font-size: 0.5rem;
    font-weight: 700;
    background: color-mix(in srgb, var(--color-border) 60%, transparent);
    color: var(--color-text-muted);
  }

  .flight-board-airline-count {
    font-size: 0.6875rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--color-text);
    line-height: 1;
  }

  .flight-board-empty {
    margin: auto;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .flight-board-table {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
  }

  .flight-board-columns,
  .flight-board-row {
    display: grid;
    grid-template-columns: 1.75rem minmax(4.5rem, 1.2fr) 2.25rem minmax(4.5rem, 1fr) minmax(3.25rem, auto);
    gap: 0.25rem 0.35rem;
    align-items: center;
  }

  .flight-board-row--active {
    border-radius: 0.35rem;
    border-left: 2px solid transparent;
  }

  .flight-board-row--active[data-kind='arrival'] {
    border-left-color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 8%, transparent);
  }

  .flight-board-row--active[data-kind='departure'] {
    border-left-color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 8%, transparent);
  }

  .flight-board-col-thumb {
    width: 1.75rem;
  }

  .flight-board-columns {
    padding: 0.1rem 0.15rem 0.08rem;
    flex-shrink: 0;
  }

  .flight-board-col {
    font-size: 0.5rem;
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
    padding: 0.22rem 0.15rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 45%, transparent);
  }

  .flight-board-row--lead {
    grid-template-columns: 3.75rem minmax(4.5rem, 1.2fr) 2.5rem minmax(4.5rem, 1fr) minmax(3.25rem, auto);
    gap: 0.35rem 0.45rem;
    padding: 0.4rem 0.2rem;
    border-bottom-color: color-mix(in srgb, var(--color-border) 70%, transparent);
  }

  .flight-board-row--lead.flight-board-row--active[data-kind='arrival'] {
    background: color-mix(in srgb, var(--color-success) 11%, transparent);
  }

  .flight-board-row--lead.flight-board-row--active[data-kind='departure'] {
    background: color-mix(in srgb, var(--color-warning) 11%, transparent);
  }

  .flight-board-row--lead .flight-board-col-thumb {
    width: auto;
  }

  .flight-board-row--lead .flight-board-flight {
    font-size: 0.9375rem;
  }

  .flight-board-row--lead .flight-board-carrier {
    font-size: 0.6875rem;
  }

  .flight-board-row--lead .flight-board-aircraft {
    font-size: 0.625rem;
  }

  .flight-board-row--lead .flight-board-airport {
    font-size: 0.8125rem;
  }

  .flight-board-row--lead .flight-board-col-time {
    font-size: 0.8125rem;
    font-weight: 700;
  }

  .flight-board-row--lead .flight-board-status {
    font-size: 0.625rem;
  }

  .flight-board-row--lead :global(.badge) {
    font-size: 0.625rem;
    padding: 0.12rem 0.4rem;
  }

  .flight-board-row--lead :global(.aircraft-mfr-tag) {
    font-size: 0.5625rem;
  }

  .flight-board-row:last-child {
    border-bottom: none;
  }

  .flight-board-col-flight {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.04rem;
    min-width: 0;
  }

  .flight-board-flight-line {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
  }

  .flight-board-flight {
    font-weight: 700;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .flight-board-carrier {
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  .flight-board-aircraft {
    font-size: 0.5rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .flight-board-airport {
    font-weight: 600;
    font-size: 0.6875rem;
    letter-spacing: 0.02em;
  }

  .flight-board-col-time {
    font-size: 0.6875rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--color-text);
  }

  .flight-board-col-status {
    display: flex;
    justify-content: flex-end;
    min-width: 0;
  }

  .flight-board-status {
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
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

  .flight-board :global(.badge) {
    font-size: 0.5625rem;
    padding: 0.1rem 0.35rem;
  }
</style>
