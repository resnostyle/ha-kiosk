<script lang="ts">
  import AnimatedClock from '../components/AnimatedClock.svelte'
  import ConnectionBanner from '../components/ConnectionBanner.svelte'
  import PlayroomLights from '../components/PlayroomLights.svelte'
  import PlayroomBackdrop from '../components/playroom/PlayroomBackdrop.svelte'
  import PlayroomSpotlight from '../components/playroom/PlayroomSpotlight.svelte'
  import WeatherNest from '../components/weather/WeatherNest.svelte'
  import { entityConfig } from '../lib/config/types'
  import { useIdle } from '../lib/playroom/useIdle.svelte'
  import { useEntityStore } from '../lib/ha/useEntityStore.svelte'
  import { isEntityAvailable, isOn } from '../lib/ha/utils'

  const store = useEntityStore()
  const playroom = entityConfig.playroom
  const settle = playroom.settle ?? {}
  const idle = useIdle((settle.idleSeconds ?? 120) * 1000)

  const lights = $derived(
    (Object.entries(playroom.lights) as Array<[string, string]>).map(([key, entityId]) => ({
      key,
      entityId,
      entity: store.entity(entityId),
    })),
  )

  const scenes = $derived(
    (Object.entries(playroom.scenes) as Array<[string, string]>).map(([key, entityId]) => ({
      key,
      entityId,
    })),
  )

  const allLightIds = $derived(Object.values(playroom.lights))

  const anyOn = $derived(
    lights.some(({ entity }) => isEntityAvailable(entity) && isOn(entity)),
  )
</script>

<PlayroomBackdrop settled={idle.settled} />

<div
  class="playroom-page"
  class:lights-on={anyOn}
  class:playroom-settled={idle.settled}
>
  <ConnectionBanner status={store.status} error={store.error} />

  <div class="playroom-grid">
    <header class="playroom-top">
      <p class="playroom-room">Playroom</p>
      {#if idle.settled}
        <p class="playroom-settle-hint">Ambient mode</p>
      {/if}
    </header>

    <div class="playroom-clock">
      <AnimatedClock />
      <div class="playroom-weather">
        <WeatherNest entity={store.entity(entityConfig.weather)} compact />
      </div>
    </div>

    <div class="playroom-controls">
      <PlayroomLights {lights} {scenes} {allLightIds} />
    </div>

    <div class="playroom-spotlight-wrap">
      <PlayroomSpotlight
        feeds={settle.feeds}
        facts={settle.facts}
        greetings={settle.greetings}
        cycleSeconds={settle.spotlightSeconds ?? 12}
        settled={idle.settled}
      />
    </div>
  </div>
</div>

<style>
  .playroom-page {
    position: relative;
    z-index: 1;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    touch-action: manipulation;
    --clock-accent: #5eb8ff;
    transition: --clock-accent 1.2s ease;
  }

  .playroom-page.lights-on {
    --clock-accent: #fbbf24;
  }

  .playroom-page.playroom-settled .playroom-controls {
    opacity: 0.78;
    transform: scale(0.985);
    filter: saturate(0.92);
  }

  .playroom-page.playroom-settled .playroom-clock {
    transform: scale(1.03);
  }

  .playroom-page.playroom-settled .playroom-weather {
    opacity: 0.9;
  }

  .playroom-grid {
    flex: 1;
    display: grid;
    width: 100%;
    max-width: 72rem;
    margin: 0 auto;
    padding: 1rem 1.25rem 3.75rem;
    gap: 0.75rem 1rem;
    min-height: 0;
    align-content: stretch;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'top top'
      'clock controls'
      'spotlight spotlight';
  }

  .playroom-top {
    grid-area: top;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
  }

  .playroom-room {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .playroom-settle-hint {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--clock-accent, #5eb8ff) 70%, var(--color-text-muted));
    animation: settle-hint-pulse 2.8s ease-in-out infinite;
  }

  .playroom-clock {
    grid-area: clock;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.75rem;
    min-height: 0;
    min-width: 0;
    transition:
      transform 1.2s ease,
      opacity 1.2s ease;
  }

  .playroom-weather {
    min-width: 0;
    transition: opacity 1.2s ease;
  }

  .playroom-controls {
    grid-area: controls;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 0;
    min-width: 0;
    transition:
      opacity 1.2s ease,
      transform 1.2s ease,
      filter 1.2s ease;
  }

  .playroom-spotlight-wrap {
    grid-area: spotlight;
    min-width: 0;
    align-self: end;
  }

  @keyframes settle-hint-pulse {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 1;
    }
  }

  @media (min-width: 900px) and (max-height: 700px) {
    .playroom-grid {
      padding: 1rem 1.75rem 3.5rem;
      gap: 0.85rem 1.5rem;
      grid-template-columns: 1.05fr 0.95fr;
    }
  }

  @media (max-aspect-ratio: 4/5) {
    .playroom-grid {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto auto;
      grid-template-areas:
        'top'
        'clock'
        'controls'
        'spotlight';
    }

    .playroom-clock {
      align-items: center;
      justify-content: flex-start;
    }

    .playroom-weather {
      width: 100%;
      max-width: 22rem;
    }

    .playroom-clock :global(.animated-clock) {
      width: 100%;
      max-width: 24rem;
    }

    .playroom-clock :global(.clock-time-row) {
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .playroom-settle-hint,
    .playroom-clock,
    .playroom-controls,
    .playroom-weather {
      animation: none;
      transition: none;
    }

    .playroom-page.playroom-settled .playroom-clock {
      transform: none;
    }
  }
</style>
