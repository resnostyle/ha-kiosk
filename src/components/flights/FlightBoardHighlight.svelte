<script lang="ts">
  import type { BoardFlight, BoardKind, InterestingFlightReason } from '../../lib/flights/types'
  import {
    airlineLogoUrl,
    boardDelayInfo,
    boardTimeDisplay,
    flightStatToneToBadgeClass,
    interestingFlightReasonLabel,
    isActiveBoardFlight,
  } from '../../lib/flights/utils'
  import AircraftManufacturerTag from './AircraftManufacturerTag.svelte'
  import AircraftThumb from './AircraftThumb.svelte'

  interface Props {
    flight: BoardFlight
    kind: BoardKind
    delayMinutes?: number | null
    reason?: InterestingFlightReason | null
    size?: 'default' | 'large'
  }

  let { flight, kind, delayMinutes = null, reason = null, size = 'default' }: Props = $props()

  const delay = $derived(boardDelayInfo(flight, kind))
  const active = $derived(isActiveBoardFlight(flight, kind))
  const logoUrl = $derived(airlineLogoUrl(flight.airlineIata))
  const airlineCode = $derived(
    flight.airlineIata ?? flight.airline.trim().split(/\s+/)[0]?.slice(0, 3).toUpperCase() ?? '—',
  )
  const roleLabel = $derived(kind === 'arrival' ? 'Arriving' : 'Departing')

  let logoFailed = $state(false)

  $effect(() => {
    flight.airlineIata
    logoFailed = false
  })
</script>

<article class="flight-board-highlight" class:flight-board-highlight--large={size === 'large'} class:active data-kind={kind}>
  <AircraftThumb
    src={flight.photoUrl}
    label={flight.aircraftModel || flight.flightNumber}
    size={size === 'large' ? 'xl' : 'lg'}
  />

  <div class="highlight-body">
    <div class="highlight-head">
      <span class="highlight-role">{roleLabel}</span>
      {#if reason}
        <span class="highlight-tag" data-reason={reason}>{interestingFlightReasonLabel(reason)}</span>
      {/if}
      <AircraftManufacturerTag
        aircraftCode={flight.aircraftCode}
        aircraftModel={flight.aircraftModel}
        majorOnly
      />
      <span class="highlight-flight">{flight.flightNumber}</span>
      <span class="highlight-airport">{flight.airportCode}</span>
    </div>

    <div class="highlight-meta">
      <span class="highlight-logo" aria-hidden="true">
        {#if logoUrl && !logoFailed}
          <img src={logoUrl} alt="" loading="lazy" onerror={() => (logoFailed = true)} />
        {:else}
          <span class="highlight-logo-fallback">{airlineCode}</span>
        {/if}
      </span>
      {#if flight.aircraftModel}
        <span class="highlight-aircraft">{flight.aircraftModel}</span>
      {/if}
    </div>
  </div>

  <div class="highlight-side">
    {#if delayMinutes != null}
      <span class="highlight-delay">+{delayMinutes}m</span>
    {:else}
      <span class="highlight-time">{boardTimeDisplay(flight, kind)}</span>
    {/if}
    {#if delay}
      <span class={flightStatToneToBadgeClass(delay.tone)}>{delay.label}</span>
    {/if}
  </div>
</article>

<style>
  .flight-board-highlight {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.4rem 0.5rem;
    align-items: center;
    padding: 0.35rem 0.45rem;
    border-radius: 0.5rem;
    background: var(--color-surface-overlay);
    border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
    border-left-width: 3px;
    border-left-style: solid;
    border-left-color: transparent;
  }

  .flight-board-highlight[data-kind='arrival'] {
    border-left-color: var(--color-success);
  }

  .flight-board-highlight[data-kind='departure'] {
    border-left-color: var(--color-warning);
  }

  .flight-board-highlight.active[data-kind='arrival'] {
    background: color-mix(in srgb, var(--color-success) 10%, var(--color-surface-overlay));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-success) 18%, transparent);
  }

  .flight-board-highlight.active[data-kind='departure'] {
    background: color-mix(in srgb, var(--color-warning) 10%, var(--color-surface-overlay));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-warning) 18%, transparent);
  }

  .highlight-body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
  }

  .highlight-head {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .highlight-role {
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .highlight-tag {
    font-size: 0.4375rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0.08rem 0.28rem;
    border-radius: 0.2rem;
    flex-shrink: 0;
    background: color-mix(in srgb, var(--color-accent) 16%, transparent);
    color: var(--color-accent);
  }

  .highlight-tag[data-reason='heavy'] {
    background: color-mix(in srgb, var(--color-warning) 18%, transparent);
    color: var(--color-warning);
  }

  .highlight-tag[data-reason='cargo'] {
    background: color-mix(in srgb, var(--color-text-muted) 20%, transparent);
    color: var(--color-text-muted);
  }

  .highlight-tag[data-reason='live'] {
    background: color-mix(in srgb, var(--color-success) 18%, transparent);
    color: var(--color-success);
  }

  .highlight-flight {
    font-size: 0.8125rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .highlight-airport {
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .highlight-meta {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
  }

  .highlight-logo {
    display: grid;
    place-items: center;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .highlight-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 0.15rem;
    background: #fff;
    padding: 0.08rem;
  }

  .highlight-logo-fallback {
    display: grid;
    place-items: center;
    width: 1rem;
    height: 1rem;
    border-radius: 0.15rem;
    font-size: 0.4375rem;
    font-weight: 700;
    background: color-mix(in srgb, var(--color-border) 60%, transparent);
    color: var(--color-text-muted);
  }

  .highlight-aircraft {
    font-size: 0.5625rem;
    font-weight: 500;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .highlight-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.08rem;
    flex-shrink: 0;
  }

  .highlight-delay {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--color-warning);
    font-variant-numeric: tabular-nums;
  }

  .highlight-time {
    font-size: 0.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .highlight-side :global(.badge) {
    font-size: 0.5rem;
    padding: 0.08rem 0.3rem;
  }

  .flight-board-highlight--large {
    gap: 0.5rem 0.65rem;
    padding: 0.5rem 0.6rem;
    border-radius: 0.6rem;
  }

  .flight-board-highlight--large .highlight-body {
    gap: 0.2rem;
  }

  .flight-board-highlight--large .highlight-head {
    gap: 0.4rem;
  }

  .flight-board-highlight--large .highlight-role {
    font-size: 0.5625rem;
  }

  .flight-board-highlight--large .highlight-tag {
    font-size: 0.5rem;
    padding: 0.1rem 0.32rem;
  }

  .flight-board-highlight--large .highlight-flight {
    font-size: 1.0625rem;
  }

  .flight-board-highlight--large .highlight-airport {
    font-size: 0.9375rem;
  }

  .flight-board-highlight--large .highlight-logo,
  .flight-board-highlight--large .highlight-logo-fallback {
    width: 1.25rem;
    height: 1.25rem;
  }

  .flight-board-highlight--large .highlight-logo-fallback {
    font-size: 0.5rem;
  }

  .flight-board-highlight--large .highlight-aircraft {
    font-size: 0.6875rem;
  }

  .flight-board-highlight--large .highlight-delay {
    font-size: 1rem;
  }

  .flight-board-highlight--large .highlight-time {
    font-size: 0.9375rem;
  }

  .flight-board-highlight--large .highlight-side {
    gap: 0.12rem;
  }

  .flight-board-highlight--large .highlight-side :global(.badge) {
    font-size: 0.5625rem;
    padding: 0.1rem 0.35rem;
  }
</style>
