<script lang="ts">
  import ConnectionBanner from '../components/ConnectionBanner.svelte'
  import ClockHeader from '../components/ClockHeader.svelte'
  import NestAlerts from '../components/NestAlerts.svelte'
  import WeatherNest from '../components/weather/WeatherNest.svelte'
  import { entityConfig, masterBedroomCoverLabel } from '../lib/config/types'
  import { triggerAutomation } from '../lib/ha/services'
  import { useEntityStore } from '../lib/ha/useEntityStore.svelte'
  import { isEntityAvailable, isOn } from '../lib/ha/utils'

  const store = useEntityStore()
  const { light, automationWhenOn, automationWhenOff, doors, covers } =
    entityConfig.masterBedroom

  const coverAlerts = $derived(
    (Object.entries(covers) as Array<[keyof typeof covers, string]>).map(
      ([key, entityId]) => ({
        entityId,
        label: masterBedroomCoverLabel(key),
      }),
    ),
  )

  let pressing = $state(false)
  let feedback = $state<string | null>(null)
  let error = $state<string | null>(null)

  const lightEntity = $derived(store.entity(light))
  const available = $derived(isEntityAvailable(lightEntity))
  const lightsOn = $derived(isOn(lightEntity))

  const targetAutomation = $derived(lightsOn ? automationWhenOn : automationWhenOff)
  const actionLabel = $derived(lightsOn ? 'Turn off' : 'Turn on')
  const statusLabel = $derived(
    !available ? 'Unavailable' : lightsOn ? 'Lights on' : 'Lights off',
  )

  async function handleTap() {
    if (pressing || !available) return
    pressing = true
    error = null
    feedback = null
    try {
      await triggerAutomation(targetAutomation)
      feedback = 'Sent'
      window.setTimeout(() => {
        feedback = null
      }, 1500)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to trigger'
    } finally {
      pressing = false
    }
  }
</script>

<div class="nest-page" class:lights-on={lightsOn && available}>
  <ConnectionBanner status={store.status} error={store.error} />

  <div class="nest-grid">
    <header class="nest-top">
      <p class="nest-room">Master Bedroom</p>
    </header>

    <div class="nest-clock">
      <ClockHeader nest />
    </div>

    <div class="nest-weather">
      <WeatherNest entity={store.entity(entityConfig.weather)} compact />
      <NestAlerts
        presenceZones={entityConfig.aqaraPresenceZones}
        {doors}
        covers={coverAlerts}
        getEntity={(id) => store.entity(id)}
      />
    </div>

    <div class="nest-control">
      <button
        type="button"
        class="nest-button"
        class:nest-button-on={lightsOn && available}
        class:nest-button-off={!lightsOn && available}
        class:nest-button-disabled={!available}
        disabled={!available || pressing}
        onclick={handleTap}
      >
        <span class="nest-glow" aria-hidden="true"></span>
        <span class="nest-icon" aria-hidden="true">
          {#if lightsOn}
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="14" fill="currentColor" opacity="0.95" />
              {#each Array(8) as _, i}
                <rect
                  x="30"
                  y="6"
                  width="4"
                  height="12"
                  rx="2"
                  fill="currentColor"
                  transform="rotate({i * 45} 32 32)"
                />
              {/each}
            </svg>
          {:else}
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="14" fill="currentColor" opacity="0.35" />
              {#each Array(8) as _, i}
                <rect
                  x="30"
                  y="6"
                  width="4"
                  height="12"
                  rx="2"
                  fill="currentColor"
                  opacity="0.35"
                  transform="rotate({i * 45} 32 32)"
                />
              {/each}
            </svg>
          {/if}
        </span>
        <span class="nest-status">{statusLabel}</span>
        <span class="nest-action">{pressing ? 'Running…' : actionLabel}</span>
        {#if feedback}
          <span class="nest-feedback">{feedback}</span>
        {/if}
      </button>

      {#if error}
        <p class="nest-error">{error}</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .nest-page {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: radial-gradient(ellipse at 30% 0%, #1a2744 0%, #0f1419 60%);
    touch-action: manipulation;
  }

  .nest-page.lights-on {
    background: radial-gradient(ellipse at 70% 0%, #3d2e14 0%, #0f1419 60%);
  }

  .nest-grid {
    flex: 1;
    display: grid;
    width: 100%;
    max-width: 72rem;
    margin: 0 auto;
    padding: 1rem 1.25rem 1.25rem;
    gap: 0.75rem 1rem;
    min-height: 0;
    align-content: stretch;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'top top'
      'clock control'
      'weather control';
  }

  .nest-top {
    grid-area: top;
    display: flex;
    align-items: center;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
  }

  .nest-room {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .nest-clock {
    grid-area: clock;
    display: flex;
    align-items: flex-end;
    min-height: 0;
  }

  .nest-clock :global(.clock-nest) {
    text-align: left;
    width: 100%;
  }

  .nest-weather {
    grid-area: weather;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-height: 0;
    min-width: 0;
    align-self: start;
  }

  .nest-control {
    grid-area: control;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
    min-width: 0;
  }

  .nest-button {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    width: 100%;
    min-height: 10rem;
    border: 2px solid var(--color-border);
    border-radius: 1.5rem;
    background: var(--color-surface-raised);
    color: var(--color-text);
    cursor: pointer;
    transition:
      transform 0.15s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .nest-button:active:not(:disabled) {
    transform: scale(0.98);
  }

  .nest-button-on {
    border-color: color-mix(in srgb, #fbbf24 50%, var(--color-border));
    box-shadow: 0 0 56px color-mix(in srgb, #fbbf24 22%, transparent);
  }

  .nest-button-off {
    border-color: var(--color-border);
  }

  .nest-button-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .nest-glow {
    position: absolute;
    inset: 8%;
    border-radius: 1.25rem;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.14) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .nest-button-on .nest-glow {
    opacity: 1;
  }

  .nest-icon {
    width: clamp(4rem, 18vw, 6.5rem);
    height: clamp(4rem, 18vw, 6.5rem);
    color: #fbbf24;
  }

  .nest-button-off .nest-icon {
    color: var(--color-text-muted);
  }

  .nest-status {
    font-size: clamp(1.5rem, 5vw, 2.25rem);
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .nest-action {
    font-size: clamp(1rem, 3vw, 1.25rem);
    color: var(--color-text-muted);
  }

  .nest-feedback {
    position: absolute;
    bottom: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-success);
    animation: feedback-pop 0.35s ease;
  }

  .nest-error {
    margin: 0;
    color: var(--color-danger);
    font-size: 0.85rem;
    text-align: center;
  }

  @keyframes feedback-pop {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Nest Hub landscape — wider control column */
  @media (min-width: 900px) and (max-height: 700px) {
    .nest-grid {
      padding: 1rem 1.75rem 1.5rem;
      gap: 0.85rem 1.5rem;
      grid-template-columns: 1.05fr 0.95fr;
    }

    .nest-clock :global(.clock-nest .clock-time) {
      font-size: 3.75rem;
    }

    .nest-clock :global(.clock-nest .clock-date) {
      font-size: 1.2rem;
    }
  }

  /* Portrait / tall screens — stack vertically */
  @media (max-aspect-ratio: 4/5) {
    .nest-grid {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto minmax(14rem, 1fr);
      grid-template-areas:
        'top'
        'clock'
        'weather'
        'control';
    }

    .nest-clock :global(.clock-nest) {
      text-align: center;
    }

    .nest-clock {
      align-items: center;
    }
  }
</style>
