<script lang="ts">
  import type { OverheadFlight } from '../../lib/flights/types'
  import {
    flightStatToneToBadgeClass,
    formatVerticalSpeed,
    overheadAirportRole,
    overheadAirportRoleLabel,
    overheadAirportRoleShortLabel,
    overheadDelayInfo,
    overheadGroundDetail,
    overheadScheduleLine,
    routeLabel,
  } from '../../lib/flights/utils'
  import AirlineMark from './AirlineMark.svelte'

  interface Props {
    flight: OverheadFlight
    airportCode?: string | null
    compact?: boolean
  }

  let { flight, airportCode = null, compact = false }: Props = $props()

  const title = $derived(flight.flightNumber ?? flight.callsign)
  const aircraftSuffix = $derived(flight.aircraftModel ? ` · ${flight.aircraftModel}` : '')
  const airportRole = $derived(overheadAirportRole(flight, airportCode))
  const airportRoleLabel = $derived(
    airportRole
      ? compact
        ? overheadAirportRoleShortLabel(airportRole, airportCode)
        : overheadAirportRoleLabel(airportRole, airportCode)
      : null,
  )
  const airportRoleBadgeClass = $derived(
    airportRole === 'arrival' ? 'badge badge--success' : 'badge badge--warn',
  )
  const delayInfo = $derived(overheadDelayInfo(flight, airportCode))
  const scheduleLine = $derived(overheadScheduleLine(flight, airportCode))
  const groundDetail = $derived(overheadGroundDetail(flight, airportCode))
  const verticalSpeedLabel = $derived(formatVerticalSpeed(flight))
  const altitudeLabel = $derived(
    flight.onGround ? 'Ground' : `${Math.round(flight.altitude).toLocaleString()} ft`,
  )
</script>

<article
  class="flight-overhead-card"
  class:flight-overhead-card--panel={!compact}
  class:flight-overhead-card--compact={compact}
  data-airport-role={airportRole ?? undefined}
>
  {#if flight.photoUrl}
    <img class="flight-overhead-thumb" src={flight.photoUrl} alt="" loading="lazy" />
  {:else}
    <div class="flight-overhead-thumb flight-overhead-thumb-fallback" aria-hidden="true">✈</div>
  {/if}

  <div class="flight-overhead-info">
    <div class="flight-overhead-head">
      <h3 class="flight-overhead-title">{title}</h3>
      <div class="flight-overhead-badges">
        {#if airportRole && airportRoleLabel}
          <span class={airportRoleBadgeClass}>{airportRoleLabel}</span>
        {/if}
        {#if delayInfo}
          <span class={flightStatToneToBadgeClass(delayInfo.tone)}>{delayInfo.label}</span>
        {/if}
        {#if flight.tracked}
          <span class="badge badge--accent">Tracked</span>
        {/if}
      </div>
    </div>

    <p class="flight-overhead-route">{routeLabel(flight)}</p>

    <AirlineMark
      class="flight-overhead-airline"
      name={flight.airline}
      iata={flight.airlineIata}
      suffix={aircraftSuffix}
    />

    {#if scheduleLine}
      <p class="flight-overhead-schedule">{scheduleLine}</p>
    {/if}

    {#if groundDetail}
      <p class="flight-overhead-ground">{groundDetail}</p>
    {/if}
  </div>

  <dl class="flight-overhead-stats" class:flight-overhead-stats--vs={verticalSpeedLabel != null}>
    <div>
      <dt>Alt</dt>
      <dd>{altitudeLabel}</dd>
    </div>
    <div>
      <dt>Speed</dt>
      <dd>{Math.round(flight.groundSpeed)} kt</dd>
    </div>
    <div>
      <dt>Dist</dt>
      <dd>{flight.distance.toFixed(1)} mi</dd>
    </div>
    <div>
      <dt>Hdg</dt>
      <dd>{Math.round(flight.heading)}°</dd>
    </div>
    {#if verticalSpeedLabel}
      <div>
        <dt>VS</dt>
        <dd>{verticalSpeedLabel}</dd>
      </div>
    {/if}
  </dl>
</article>

<style>
  .flight-overhead-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas: 'thumb info stats';
    gap: 0.65rem 0.85rem;
    align-items: center;
    padding: 0.65rem 0.7rem;
    width: 100%;
    min-width: 0;
    border-left: 3px solid transparent;
  }

  .flight-overhead-card--panel {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    border-left-width: 3px;
    border-left-style: solid;
    border-left-color: transparent;
    padding: 0.75rem;
  }

  .flight-overhead-card--compact {
    border-radius: 0.65rem;
    background: var(--color-surface-overlay);
    border: none;
    border-left: 3px solid transparent;
  }

  .flight-overhead-card[data-airport-role='arrival'] {
    border-left-color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 6%, var(--color-surface-overlay));
  }

  .flight-overhead-card--panel[data-airport-role='arrival'] {
    background: color-mix(in srgb, var(--color-success) 6%, var(--color-surface-raised));
  }

  .flight-overhead-card[data-airport-role='departure'] {
    border-left-color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 6%, var(--color-surface-overlay));
  }

  .flight-overhead-card--panel[data-airport-role='departure'] {
    background: color-mix(in srgb, var(--color-warning) 6%, var(--color-surface-raised));
  }

  .flight-overhead-thumb {
    grid-area: thumb;
    width: 4.75rem;
    height: 4.75rem;
    border-radius: 0.65rem;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--color-surface-overlay);
    align-self: start;
  }

  .flight-overhead-card--panel .flight-overhead-thumb {
    width: 5.5rem;
    height: 5.5rem;
  }

  .flight-overhead-thumb-fallback {
    display: grid;
    place-items: center;
    font-size: 1.5rem;
    color: var(--color-text-muted);
  }

  .flight-overhead-info {
    grid-area: info;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    align-self: center;
  }

  .flight-overhead-head {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .flight-overhead-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .flight-overhead-badges {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .flight-overhead-route {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .flight-overhead-card :global(.flight-overhead-airline.airline-mark) {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.3;
  }

  .flight-overhead-card :global(.flight-overhead-airline .airline-mark-logo) {
    width: 1.25rem;
    height: 1.25rem;
  }

  .flight-overhead-schedule {
    margin: 0.1rem 0 0;
    font-size: 0.8125rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-text);
  }

  .flight-overhead-ground {
    margin: 0.1rem 0 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    line-height: 1.3;
  }

  .flight-overhead-stats {
    grid-area: stats;
    display: grid;
    grid-template-columns: repeat(2, minmax(3.5rem, max-content));
    gap: 0.35rem 1rem;
    margin: 0;
    align-self: center;
    justify-self: end;
  }

  .flight-overhead-stats--vs {
    grid-template-columns: repeat(3, minmax(3rem, max-content));
  }

  .flight-overhead-stats div {
    min-width: 0;
  }

  .flight-overhead-stats dt {
    margin: 0;
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .flight-overhead-stats dd {
    margin: 0.1rem 0 0;
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .flight-overhead-card {
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas:
        'thumb info'
        'stats stats';
      align-items: start;
    }

    .flight-overhead-stats,
    .flight-overhead-stats--vs {
      justify-self: stretch;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      padding-top: 0.35rem;
      border-top: 1px solid color-mix(in srgb, var(--color-border) 65%, transparent);
    }

    .flight-overhead-stats--vs {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }
</style>
