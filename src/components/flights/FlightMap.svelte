<script lang="ts">
  import L from 'leaflet'
  import 'leaflet/dist/leaflet.css'
  import type { FlightMapCenter } from '../../lib/config/types'
  import type { OverheadFlight } from '../../lib/flights/types'
  import { computeRadarView, formatVerticalSpeed, hasMapPosition, overheadAirportRole, overheadAirportRoleLabel, overheadDelayInfo, overheadGroundDetail, overheadScheduleLine, readFlightMarkerColors, routeLabel } from '../../lib/flights/utils'

  interface Props {
    flights: OverheadFlight[]
    center: FlightMapCenter
    airportCode?: string | null
    layout?: 'default' | 'sidebar'
  }

  let { flights, center, airportCode = null, layout = 'default' }: Props = $props()

  let mapEl = $state<HTMLDivElement | null>(null)
  let mapReady = $state(false)
  let map: L.Map | null = null
  let markersLayer: L.LayerGroup | null = null
  let rangeLayer: L.Circle | null = null
  let mapSize = $state({ width: 720, height: 280 })
  let syncRequest = 0
  let markerColors = $state(readFlightMarkerColors())

  const positionedFlights = $derived(flights.filter(hasMapPosition))
  const radarView = $derived(computeRadarView(positionedFlights, center, mapSize))

  function flightLabel(flight: OverheadFlight): string {
    return flight.flightNumber ?? flight.callsign
  }

  function markerColor(flight: OverheadFlight): string {
    const colors = markerColors
    const role = overheadAirportRole(flight, airportCode)
    if (role === 'arrival') return colors.arrival
    if (role === 'departure') return colors.departure
    if (flight.onGround) return colors.ground
    if (flight.tracked) return colors.tracked
    return colors.airborne
  }

  function createPlaneIcon(flight: OverheadFlight): L.DivIcon {
    const color = markerColor(flight)
    return L.divIcon({
      className: 'flight-map-plane-icon',
      html: `<span class="flight-map-plane" style="transform: rotate(${flight.heading}deg); color: ${color}">✈</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
  }

  function popupHtml(flight: OverheadFlight): string {
    const alt = flight.onGround ? 'On ground' : `${Math.round(flight.altitude)} ft`
    const speed = `${Math.round(flight.groundSpeed)} kt`
    const dist = `${flight.distance.toFixed(1)} mi`
    const role = overheadAirportRole(flight, airportCode)
    const roleLine = role
      ? `<div class="flight-map-popup-role" data-role="${role}">${overheadAirportRoleLabel(role, airportCode)}</div>`
      : ''
    const groundLine = overheadGroundDetail(flight, airportCode)
    const groundHtml = groundLine ? `<div class="flight-map-popup-ground">${groundLine}</div>` : ''
    const scheduleLine = overheadScheduleLine(flight, airportCode)
    const scheduleHtml = scheduleLine
      ? `<div class="flight-map-popup-schedule">${scheduleLine}</div>`
      : ''
    const delay = overheadDelayInfo(flight, airportCode)
    const delayHtml = delay ? `<div class="flight-map-popup-delay">${delay.label}</div>` : ''
    const vs = formatVerticalSpeed(flight)
    const vsHtml = vs ? ` · ${vs}` : ''
    return `
      <div class="flight-map-popup">
        <strong>${flightLabel(flight)}</strong>
        ${roleLine}
        ${delayHtml}
        ${scheduleHtml}
        ${groundHtml}
        <div>${flight.airline}</div>
        <div>${routeLabel(flight)}</div>
        <div>${alt} · ${speed}${vsHtml} · ${dist}</div>
      </div>
    `
  }

  function addCenterMarker(layer: L.LayerGroup) {
    L.circleMarker([center.latitude, center.longitude], {
      radius: 7,
      color: markerColors.departure,
      fillColor: markerColors.departure,
      fillOpacity: 0.85,
      weight: 2,
    })
      .bindTooltip(center.label ?? 'Center', { permanent: false, direction: 'top' })
      .addTo(layer)
  }

  function syncMapView() {
    const activeMap = map
    const layer = markersLayer
    if (!activeMap || !layer) return

    const size = activeMap.getSize()
    if (size.x < 2 || size.y < 2) return

    const { latitude, longitude, zoom, radiusMiles } = radarView
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(zoom)) {
      return
    }

    const requestId = ++syncRequest

    activeMap.setView([latitude, longitude], zoom, { animate: false })
    activeMap.invalidateSize()

    activeMap.whenReady(() => {
      if (!map || map !== activeMap || !markersLayer || requestId !== syncRequest) return

      const mapSizeNow = map.getSize()
      if (mapSizeNow.x < 2 || mapSizeNow.y < 2) return

      markersLayer.clearLayers()
      addCenterMarker(markersLayer)

      if (rangeLayer) {
        rangeLayer.remove()
        rangeLayer = null
      }

      if (Number.isFinite(radiusMiles) && radiusMiles > 0) {
        rangeLayer = L.circle([latitude, longitude], {
          radius: radiusMiles * 1609.344,
          color: markerColors.accent,
          opacity: 0.45,
          weight: 1,
          fillColor: markerColors.accent,
          fillOpacity: 0.06,
          dashArray: '5 7',
        }).addTo(map)
      }

      for (const flight of positionedFlights) {
        L.marker([flight.latitude, flight.longitude], { icon: createPlaneIcon(flight) })
          .bindPopup(popupHtml(flight), { closeButton: false, maxWidth: 240 })
          .addTo(markersLayer)
      }
    })
  }

  $effect(() => {
    const el = mapEl
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width < 1 || height < 1) return
      mapSize = { width, height }
      map?.invalidateSize()
      syncMapView()
    })
    observer.observe(el)

    map = L.map(el, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    })

    markerColors = readFlightMarkerColors()

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    markersLayer = L.layerGroup().addTo(map)

    requestAnimationFrame(() => {
      map?.invalidateSize()
      syncMapView()
      mapReady = true
    })

    return () => {
      observer.disconnect()
      syncRequest++
      rangeLayer?.remove()
      map?.remove()
      map = null
      markersLayer = null
      rangeLayer = null
      mapReady = false
    }
  })

  $effect(() => {
    if (!mapReady) return
    void flights
    void radarView
    syncMapView()
  })
</script>

<section class="flight-map panel" class:flight-map--sidebar={layout === 'sidebar'}>
  <header class="flight-map-header">
    <div>
      <h2 class="section-label">Area map</h2>
      <p class="flight-map-legend">
        <span class="legend-dot legend-arrival"></span> Arriving
        <span class="legend-dot legend-departure"></span> Departing
        <span class="legend-dot legend-airborne"></span> Airborne
        <span class="legend-dot legend-tracked"></span> Tracked
        <span class="legend-dot legend-ground"></span> On ground
        <span class="flight-map-radius">~{radarView.radiusMiles.toFixed(0)} mi view</span>
      </p>
    </div>
    <span class="flight-map-count">
      {positionedFlights.length} aircraft
    </span>
  </header>

  <div class="flight-map-frame">
    {#if !mapReady}
      <p class="flight-map-loading">Loading map…</p>
    {/if}
    <div
      class="flight-map-canvas"
      bind:this={mapEl}
      role="img"
      aria-label="Map of aircraft overhead"
    ></div>
  </div>
</section>

<style>
  .flight-map {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    max-width: 52rem;
    width: 100%;
    margin-inline: auto;
  }

  .flight-map--sidebar {
    max-width: none;
    margin-inline: 0;
    width: 100%;
    flex: 1;
    height: 100%;
    min-height: 0;
  }

  .flight-map--sidebar .flight-map-frame {
    flex: 1;
    min-height: 12rem;
    height: auto;
  }

  .flight-map-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .flight-map-count {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .flight-map-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 0.75rem;
    margin: 0.25rem 0 0;
    font-size: 0.625rem;
    color: var(--color-text-muted);
  }

  .flight-map-radius {
    margin-left: 0.15rem;
    opacity: 0.85;
  }

  .legend-dot {
    display: inline-block;
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    margin-right: 0.2rem;
    vertical-align: middle;
  }

  .legend-arrival {
    background: var(--color-success);
  }

  .legend-departure {
    background: var(--color-warning);
  }

  .legend-airborne {
    background: var(--color-success);
  }

  .legend-tracked {
    background: var(--color-accent);
  }

  .legend-ground {
    background: var(--color-marker-ground);
  }

  .flight-map-frame {
    position: relative;
    width: 100%;
    height: clamp(11rem, 34vw, 15rem);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .flight-map--sidebar .flight-map-frame {
    border: none;
  }

  .flight-map:not(.flight-map--sidebar) .flight-map-frame {
    border: 1px solid var(--color-border);
  }

  .flight-map-canvas {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .flight-map-loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    pointer-events: none;
    z-index: 2;
  }

  .flight-map-canvas :global(.leaflet-container) {
    height: 100%;
    width: 100%;
    background: var(--color-surface);
    font-family: var(--font-sans);
  }

  .flight-map-canvas :global(.leaflet-control-attribution) {
    background: color-mix(in srgb, var(--color-surface-raised) 85%, transparent);
    color: var(--color-text-muted);
    font-size: 0.625rem;
  }

  .flight-map-canvas :global(.leaflet-popup-content-wrapper) {
    background: var(--color-surface-raised);
    color: var(--color-text);
    border-radius: 0.65rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  .flight-map-canvas :global(.leaflet-popup-tip) {
    background: var(--color-surface-raised);
  }

  .flight-map-canvas :global(.flight-map-popup) {
    font-size: 0.75rem;
    line-height: 1.35;
  }

  .flight-map-canvas :global(.flight-map-popup strong) {
    display: block;
    font-size: 0.875rem;
    margin-bottom: 0.15rem;
  }

  .flight-map-canvas :global(.flight-map-popup-role) {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.2rem;
  }

  .flight-map-canvas :global(.flight-map-popup-role[data-role='arrival']) {
    color: var(--color-success);
  }

  .flight-map-canvas :global(.flight-map-popup-role[data-role='departure']) {
    color: var(--color-warning);
  }

  .flight-map-canvas :global(.flight-map-popup-ground) {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: 0.2rem;
  }

  .flight-map-canvas :global(.flight-map-popup-schedule) {
    font-size: 0.6875rem;
    font-weight: 700;
    margin-bottom: 0.2rem;
  }

  .flight-map-canvas :global(.flight-map-popup-delay) {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-warning);
    margin-bottom: 0.15rem;
  }

  .flight-map-canvas :global(.flight-map-plane-icon) {
    background: transparent;
    border: none;
  }

  .flight-map-canvas :global(.flight-map-plane) {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    font-size: 1.15rem;
    line-height: 1;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.65));
  }
</style>
