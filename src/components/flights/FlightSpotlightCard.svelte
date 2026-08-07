<script lang="ts">
  import type { SpotlightFlight } from '../../lib/flights/types'
  import {
    boardDelayInfo,
    boardRouteLabel,
    boardTimeDisplay,
    formatAircraftLabel,
    formatVerticalSpeed,
    overheadAirportRoleLabel,
    overheadDelayInfo,
    overheadGroundDetail,
    overheadScheduleLine,
    routeLabel,
    spotlightReasonLabel,
  } from '../../lib/flights/utils'
  import AircraftManufacturerTag from './AircraftManufacturerTag.svelte'
  import AirlineMark from './AirlineMark.svelte'

  interface Props {
    flight: SpotlightFlight
    airportCode?: string | null
    compact?: boolean
    layout?: 'default' | 'column'
  }

  let { flight, airportCode = null, compact = false, layout = 'default' }: Props = $props()

  const overhead = $derived(flight.overhead)
  const board = $derived(flight.board)
  const kind = $derived(flight.kind)

  const flightNumber = $derived(
    overhead?.flightNumber ?? overhead?.callsign ?? board?.flightNumber ?? '—',
  )
  const airline = $derived(overhead?.airline ?? board?.airline ?? 'Unknown')
  const airlineIata = $derived(overhead?.airlineIata ?? board?.airlineIata ?? null)
  const aircraftModel = $derived(overhead?.aircraftModel ?? board?.aircraftModel ?? '')
  const aircraftCode = $derived(overhead?.aircraftCode ?? board?.aircraftCode ?? null)
  const registration = $derived(overhead?.registration ?? board?.registration ?? null)
  const photoUrl = $derived(overhead?.photoUrl ?? board?.photoUrl ?? null)

  const route = $derived(
    overhead
      ? routeLabel(overhead)
      : board && kind
        ? boardRouteLabel(board, kind, airportCode)
        : '—',
  )

  const roleLabel = $derived(
    kind
      ? overhead
        ? overheadAirportRoleLabel(kind, airportCode)
        : kind === 'arrival'
          ? `Arriving ${airportCode ?? 'airport'}`
          : `Departing ${airportCode ?? 'airport'}`
      : null,
  )

  const scheduleLine = $derived(
    overhead ? overheadScheduleLine(overhead, airportCode) : null,
  )
  const groundDetail = $derived(
    overhead ? overheadGroundDetail(overhead, airportCode) : null,
  )
  const delayInfo = $derived(
    overhead
      ? overheadDelayInfo(overhead, airportCode)
      : board && kind
        ? boardDelayInfo(board, kind)
        : null,
  )
  const boardTime = $derived(board && kind ? boardTimeDisplay(board, kind) : null)
  const verticalSpeedLabel = $derived(overhead ? formatVerticalSpeed(overhead) : null)
  const altitudeLabel = $derived(
    overhead ? (overhead.onGround ? 'Ground' : `${Math.round(overhead.altitude).toLocaleString()} ft`) : null,
  )
  const aircraftLabel = $derived(
    board
      ? formatAircraftLabel(board)
      : aircraftModel && registration
        ? `${aircraftCode ?? aircraftModel.split(/\s+/)[0]} · ${registration}`
        : aircraftModel || aircraftCode || '—',
  )
</script>

<article
  class="flight-spotlight-card"
  class:flight-spotlight-card--compact={compact}
  class:flight-spotlight-card--column={layout === 'column'}
  data-kind={kind ?? undefined}
>
  <div class="flight-spotlight-photo">
    {#if photoUrl}
      <img src={photoUrl} alt="" loading="lazy" />
    {:else}
      <div class="flight-spotlight-photo-fallback" aria-hidden="true">✈</div>
    {/if}
    <span class="flight-spotlight-reason" data-reason={flight.reason}>
      {spotlightReasonLabel(flight.reason)}
    </span>
  </div>

  <div class="flight-spotlight-body">
    <div class="flight-spotlight-head">
      <h3 class="flight-spotlight-flight">{flightNumber}</h3>
      <div class="flight-spotlight-tags">
        {#if roleLabel}
          <span class="flight-spotlight-role">{roleLabel}</span>
        {/if}
        <AircraftManufacturerTag {aircraftCode} {aircraftModel} majorOnly />
      </div>
    </div>

    <AirlineMark class="flight-spotlight-airline" name={airline} iata={airlineIata} />

    <p class="flight-spotlight-aircraft">{aircraftLabel}</p>
    <p class="flight-spotlight-route">{route}</p>

    {#if scheduleLine}
      <p class="flight-spotlight-schedule">{scheduleLine}</p>
    {:else if boardTime}
      <p class="flight-spotlight-schedule">{boardTime}</p>
    {/if}

    {#if groundDetail && !compact}
      <p class="flight-spotlight-ground">{groundDetail}</p>
    {/if}

    {#if delayInfo}
      <p class="flight-spotlight-delay" data-tone={delayInfo.tone}>{delayInfo.label}</p>
    {/if}

    {#if overhead && !compact}
      <dl class="flight-spotlight-stats">
        {#if altitudeLabel}
          <div>
            <dt>Altitude</dt>
            <dd>{altitudeLabel}</dd>
          </div>
        {/if}
        <div>
          <dt>Speed</dt>
          <dd>{Math.round(overhead.groundSpeed)} kt</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{overhead.distance.toFixed(1)} mi</dd>
        </div>
        <div>
          <dt>Heading</dt>
          <dd>{Math.round(overhead.heading)}°</dd>
        </div>
        {#if verticalSpeedLabel}
          <div>
            <dt>VS</dt>
            <dd>{verticalSpeedLabel}</dd>
          </div>
        {/if}
        {#if overhead.tracked}
          <div>
            <dt>Track</dt>
            <dd>Live</dd>
          </div>
        {/if}
      </dl>
    {:else if overhead && compact}
      <p class="flight-spotlight-telemetry">
        {altitudeLabel} · {Math.round(overhead.groundSpeed)} kt · {overhead.distance.toFixed(1)} mi
      </p>
    {:else if board && compact}
      <p class="flight-spotlight-telemetry">
        {boardTime ?? board.statusText}{#if delayInfo} · {delayInfo.label}{/if}
      </p>
    {:else if board && !compact}
      <dl class="flight-spotlight-stats flight-spotlight-stats--board">
        <div>
          <dt>Status</dt>
          <dd>{board.statusText || board.status}</dd>
        </div>
        <div>
          <dt>Airport</dt>
          <dd>{board.airportCode}</dd>
        </div>
        {#if board.airport}
          <div class="flight-spotlight-stat-wide">
            <dt>City</dt>
            <dd>{board.airport}</dd>
          </div>
        {/if}
      </dl>
    {/if}
  </div>
</article>

<style>
  .flight-spotlight-card {
    display: grid;
    grid-template-columns: minmax(5.5rem, 38%) minmax(0, 1fr);
    gap: 0.55rem;
    min-height: 0;
    padding: 0.45rem;
    border-radius: 0.65rem;
    background: var(--color-surface-overlay);
    border: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
    border-left: 3px solid transparent;
  }

  .flight-spotlight-card[data-kind='arrival'] {
    border-left-color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 7%, var(--color-surface-overlay));
  }

  .flight-spotlight-card[data-kind='departure'] {
    border-left-color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 7%, var(--color-surface-overlay));
  }

  .flight-spotlight-photo {
    position: relative;
    min-height: 5.5rem;
    border-radius: 0.5rem;
    overflow: hidden;
    background: color-mix(in srgb, var(--color-surface-raised) 85%, #0a1628);
    border: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);
  }

  .flight-spotlight-photo img {
    width: 100%;
    height: 100%;
    min-height: 5.5rem;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  .flight-spotlight-photo-fallback {
    display: grid;
    place-items: center;
    min-height: 5.5rem;
    font-size: 2rem;
    color: var(--color-text-muted);
    opacity: 0.45;
  }

  .flight-spotlight-reason {
    position: absolute;
    top: 0.3rem;
    left: 0.3rem;
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0.12rem 0.35rem;
    border-radius: 0.25rem;
    background: color-mix(in srgb, var(--color-surface-raised) 88%, transparent);
    color: var(--color-text);
    backdrop-filter: blur(4px);
  }

  .flight-spotlight-reason[data-reason='live'] {
    color: var(--color-success);
  }

  .flight-spotlight-reason[data-reason='heavy'] {
    color: var(--color-warning);
  }

  .flight-spotlight-reason[data-reason='delayed'] {
    color: var(--color-danger);
  }

  .flight-spotlight-body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }

  .flight-spotlight-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.35rem;
  }

  .flight-spotlight-flight {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .flight-spotlight-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.25rem;
  }

  .flight-spotlight-role {
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
    color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-border) 45%, transparent);
    white-space: nowrap;
  }

  .flight-spotlight-card :global(.flight-spotlight-airline.airline-mark) {
    margin: 0;
    font-size: 0.6875rem;
  }

  .flight-spotlight-card :global(.flight-spotlight-airline .airline-mark-logo) {
    width: 1.1rem;
    height: 1.1rem;
  }

  .flight-spotlight-aircraft {
    margin: 0;
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--color-text-muted);
    letter-spacing: 0.02em;
  }

  .flight-spotlight-route {
    margin: 0;
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .flight-spotlight-schedule {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .flight-spotlight-ground {
    margin: 0;
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .flight-spotlight-delay {
    margin: 0;
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .flight-spotlight-delay[data-tone='warn'],
  .flight-spotlight-delay[data-tone='danger'] {
    color: var(--color-warning);
  }

  .flight-spotlight-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.25rem 0.4rem;
    margin: 0.15rem 0 0;
    padding-top: 0.3rem;
    border-top: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
  }

  .flight-spotlight-stats--board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .flight-spotlight-stat-wide {
    grid-column: 1 / -1;
  }

  .flight-spotlight-stats dt {
    margin: 0;
    font-size: 0.5rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .flight-spotlight-stats dd {
    margin: 0.04rem 0 0;
    font-size: 0.6875rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .flight-spotlight-telemetry {
    margin: 0.1rem 0 0;
    font-size: 0.5625rem;
    font-weight: 600;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .flight-spotlight-card--compact {
    grid-template-columns: 3.25rem minmax(0, 1fr);
    gap: 0.35rem;
    padding: 0.3rem 0.35rem;
    border-radius: 0.45rem;
  }

  .flight-spotlight-card--compact .flight-spotlight-photo {
    min-height: 3.25rem;
  }

  .flight-spotlight-card--compact .flight-spotlight-photo img {
    min-height: 3.25rem;
  }

  .flight-spotlight-card--compact .flight-spotlight-photo-fallback {
    min-height: 3.25rem;
    font-size: 1.25rem;
  }

  .flight-spotlight-card--compact .flight-spotlight-flight {
    font-size: 0.875rem;
  }

  .flight-spotlight-card--compact .flight-spotlight-route {
    font-size: 0.6875rem;
  }

  .flight-spotlight-card--compact .flight-spotlight-schedule {
    font-size: 0.625rem;
  }

  .flight-spotlight-card--compact .flight-spotlight-aircraft {
    font-size: 0.5625rem;
  }

  .flight-spotlight-card--compact :global(.flight-spotlight-airline.airline-mark) {
    font-size: 0.5625rem;
  }

  .flight-spotlight-card--compact .flight-spotlight-delay {
    margin-top: 0.05rem;
  }

  .flight-spotlight-card--column {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.4rem;
    padding: 0.4rem;
  }

  .flight-spotlight-card--column .flight-spotlight-photo {
    min-height: 0;
    aspect-ratio: 16 / 9;
  }

  .flight-spotlight-card--column .flight-spotlight-photo img,
  .flight-spotlight-card--column .flight-spotlight-photo-fallback {
    min-height: 0;
    height: 100%;
  }

  .flight-spotlight-card--column .flight-spotlight-flight {
    font-size: 1rem;
  }

  .flight-spotlight-card--column .flight-spotlight-route {
    font-size: 0.75rem;
  }

  .flight-spotlight-card--column .flight-spotlight-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
</style>
