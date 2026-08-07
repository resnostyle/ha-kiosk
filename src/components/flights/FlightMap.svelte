<script lang="ts">
  import L from 'leaflet'
  import 'leaflet/dist/leaflet.css'
  import { onDestroy, onMount, tick } from 'svelte'
  import type { FlightMapCenter } from '../../lib/config/types'
  import type { OverheadFlight } from '../../lib/flights/types'
  import {
    computeRadarView,
    formatVerticalSpeed,
    hasMapPosition,
    overheadAirportRole,
    overheadAirportRoleLabel,
    overheadDelayInfo,
    overheadGroundDetail,
    overheadScheduleLine,
    readFlightMarkerColors,
    routeLabel,
  } from '../../lib/flights/utils'

  interface Props {
    flights: OverheadFlight[]
    center: FlightMapCenter
    airportCode?: string | null
    layout?: 'default' | 'sidebar'
  }

  let { flights, center, airportCode = null, layout = 'default' }: Props = $props()

  let mapEl = $state<HTMLDivElement | null>(null)
  let mapReady = $state(false)
  let mapError = $state<string | null>(null)
  let map: L.Map | null = null
  let centerLayer: L.LayerGroup | null = null
  let flightLayer: L.LayerGroup | null = null
  let rangeLayer: L.Circle | null = null
  let resizeObserver: ResizeObserver | null = null
  let mapSize = $state({ width: 640, height: 280 })
  let markerColors = $state(readFlightMarkerColors())
  const flightMarkers = new Map<string, L.Marker>()

  const positionedFlights = $derived(flights.filter(hasMapPosition))
  const liveTrackedCount = $derived(positionedFlights.length)
  const radarView = $derived(computeRadarView(positionedFlights, center, mapSize))
  const flightTrackKey = $derived(
    positionedFlights
      .map(
        (flight) =>
          `${flight.id}:${flight.latitude.toFixed(5)}:${flight.longitude.toFixed(5)}:${Math.round(flight.heading)}`,
      )
      .join('|'),
  )
  const viewportKey = $derived(
    `${radarView.latitude.toFixed(5)}:${radarView.longitude.toFixed(5)}:${radarView.zoom}:${radarView.radiusMiles.toFixed(1)}`,
  )

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
    const size = flight.onGround ? 24 : 28
    return L.divIcon({
      className: 'flight-map-plane-icon',
      html: `<svg class="flight-map-plane" width="${size}" height="${size}" viewBox="0 0 24 24" style="transform: rotate(${flight.heading}deg); color: ${color}" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
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
      radius: 6,
      color: markerColors.accent,
      fillColor: markerColors.accent,
      fillOpacity: 0.95,
      weight: 2,
    })
      .bindTooltip(center.label ?? airportCode ?? 'Airport', {
        permanent: true,
        direction: 'top',
        className: 'flight-map-hub-label',
      })
      .addTo(layer)
  }

  function syncRangeCircle(view: typeof radarView) {
    if (!map) return

    if (rangeLayer) {
      rangeLayer.remove()
      rangeLayer = null
    }

    if (!Number.isFinite(view.radiusMiles) || view.radiusMiles <= 0) return

    rangeLayer = L.circle([view.latitude, view.longitude], {
      radius: view.radiusMiles * 1609.344,
      color: markerColors.accent,
      opacity: 0.45,
      weight: 1,
      fillColor: markerColors.accent,
      fillOpacity: 0.06,
      dashArray: '5 7',
    }).addTo(map)
  }

  function syncFlightMarkers() {
    const layer = flightLayer
    if (!layer) return

    const seen = new Set<string>()

    for (const flight of positionedFlights) {
      seen.add(flight.id)
      const latLng = L.latLng(flight.latitude, flight.longitude)
      const icon = createPlaneIcon(flight)
      const popup = popupHtml(flight)
      const existing = flightMarkers.get(flight.id)

      if (existing) {
        existing.setLatLng(latLng)
        existing.setIcon(icon)
        existing.setPopupContent(popup)
        continue
      }

      const marker = L.marker(latLng, { icon })
        .bindPopup(popup, { closeButton: false, maxWidth: 240 })
        .addTo(layer)
      flightMarkers.set(flight.id, marker)
    }

    for (const [id, marker] of flightMarkers) {
      if (seen.has(id)) continue
      marker.remove()
      flightMarkers.delete(id)
    }
  }

  function measureMapSize(el: HTMLElement) {
    const rect = el.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return false
    mapSize = { width: rect.width, height: rect.height }
    return true
  }

  function syncMapViewport() {
    const activeMap = map
    const layer = centerLayer
    if (!activeMap || !layer) return

    activeMap.invalidateSize()

    const { latitude, longitude, zoom } = radarView
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(zoom)) {
      return
    }

    activeMap.setView([latitude, longitude], zoom, { animate: false })

    layer.clearLayers()
    addCenterMarker(layer)
    syncRangeCircle(radarView)
  }

  function refreshMap() {
    if (!map) return
    markerColors = readFlightMarkerColors()
    syncMapViewport()
    syncFlightMarkers()
  }

  onMount(() => {
    let cancelled = false
    let resizeTimer: ReturnType<typeof setTimeout> | undefined

    const init = async () => {
      await tick()
      if (cancelled || !mapEl) return

      try {
        measureMapSize(mapEl)
        markerColors = readFlightMarkerColors()

        const initialZoom = center.zoom ?? 13
        map = L.map(mapEl, {
          center: [center.latitude, center.longitude],
          zoom: initialZoom,
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: false,
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map)

        centerLayer = L.layerGroup().addTo(map)
        flightLayer = L.layerGroup().addTo(map)

        resizeObserver = new ResizeObserver(() => {
          if (!mapEl || !map) return
          if (!measureMapSize(mapEl)) return
          clearTimeout(resizeTimer)
          resizeTimer = setTimeout(() => {
            refreshMap()
          }, 50)
        })
        resizeObserver.observe(mapEl)

        map.whenReady(() => {
          if (cancelled || !map) return
          refreshMap()
          mapReady = true

          // Kiosk layouts often settle after first paint.
          setTimeout(() => refreshMap(), 120)
          setTimeout(() => refreshMap(), 500)
        })
      } catch (error) {
        mapError = error instanceof Error ? error.message : 'Map failed to load'
      }
    }

    void init()

    return () => {
      cancelled = true
      clearTimeout(resizeTimer)
    }
  })

  onDestroy(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    rangeLayer?.remove()
    rangeLayer = null
    for (const marker of flightMarkers.values()) {
      marker.remove()
    }
    flightMarkers.clear()
    map?.remove()
    map = null
    centerLayer = null
    flightLayer = null
  })

  $effect(() => {
    if (!mapReady) return
    void viewportKey
    syncMapViewport()
  })

  $effect(() => {
    if (!mapReady) return
    void flightTrackKey
    syncFlightMarkers()
  })
</script>

<section class="flight-map panel" class:flight-map--sidebar={layout === 'sidebar'}>
  <header class="flight-map-header">
    <p class="flight-map-legend" aria-label="Map legend">
      <span class="legend-dot legend-arrival" title="Arriving"></span>
      <span class="legend-dot legend-departure" title="Departing"></span>
      <span class="legend-dot legend-airborne" title="Airborne"></span>
      <span class="legend-dot legend-tracked" title="Tracked"></span>
      <span class="legend-dot legend-ground" title="On ground"></span>
      <span class="flight-map-radius">
        {liveTrackedCount > 0 ? `${liveTrackedCount} tracked` : 'no live traffic'}{positionedFlights.length > 0 ? ` · ~${radarView.radiusMiles.toFixed(0)} mi` : ''}
      </span>
    </p>
  </header>

  <div class="flight-map-frame">
    {#if mapError}
      <p class="flight-map-status flight-map-status--error">{mapError}</p>
    {:else if !mapReady}
      <p class="flight-map-status">Loading map…</p>
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
    gap: 0.2rem;
    padding: 0.4rem;
    max-width: 52rem;
    width: 100%;
    margin-inline: auto;
    min-height: 0;
  }

  .flight-map--sidebar {
    max-width: none;
    margin-inline: 0;
    width: 100%;
    flex: 1;
    min-height: 0;
    height: 100%;
  }

  .flight-map-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .flight-map-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.28rem 0.4rem;
    margin: 0;
    font-size: 0.5625rem;
    color: var(--color-text-muted);
  }

  .flight-map-radius {
    margin-left: 0.1rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
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
    flex: 1;
    min-height: 10rem;
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .flight-map:not(.flight-map--sidebar) .flight-map-frame {
    height: clamp(9rem, 28vw, 12rem);
    flex: none;
    border: 1px solid var(--color-border);
  }

  .flight-map--sidebar .flight-map-frame {
    border: none;
    min-height: 0;
  }

  .flight-map--sidebar .flight-map-canvas {
    min-height: 0;
  }

  .flight-map-canvas {
    position: absolute;
    inset: 0;
    z-index: 1;
    min-height: 10rem;
  }

  .flight-map-status {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    padding: 0.5rem;
    text-align: center;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    pointer-events: none;
    z-index: 2;
  }

  .flight-map-status--error {
    color: var(--color-danger);
  }

  .flight-map-canvas :global(.leaflet-container) {
    height: 100% !important;
    width: 100% !important;
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
    display: block;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.75));
  }

  .flight-map-canvas :global(.flight-map-hub-label) {
    background: color-mix(in srgb, var(--color-surface-raised) 92%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
    color: var(--color-text);
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 0.1rem 0.35rem;
    border-radius: 0.25rem;
    box-shadow: none;
  }

  .flight-map-canvas :global(.flight-map-hub-label::before) {
    display: none;
  }
</style>
