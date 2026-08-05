<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { playroomLightLabel, playroomSceneLabel } from '../lib/config/types'
  import { setLightBrightness, turnOffLights, turnOnScene, toggleLight } from '../lib/ha/services'
  import { isEntityAvailable, isOn, lightBrightnessPercent } from '../lib/ha/utils'

  interface LightEntry {
    key: string
    entityId: string
    entity: HassEntity | undefined
  }

  interface SceneEntry {
    key: string
    entityId: string
  }

  interface Props {
    lights: LightEntry[]
    scenes: SceneEntry[]
    allLightIds: string[]
  }

  let { lights, scenes, allLightIds }: Props = $props()

  let pressing = $state<string | null>(null)
  let sliderValues = $state<Record<string, number>>({})
  const brightnessTimers = new Map<string, ReturnType<typeof setTimeout>>()

  const anyOn = $derived(
    lights.some(({ entity }) => isEntityAvailable(entity) && isOn(entity)),
  )

  function displayBrightness(entityId: string, entity: HassEntity | undefined): number {
    if (sliderValues[entityId] != null) return sliderValues[entityId]
    const reported = lightBrightnessPercent(entity)
    if (reported != null) return reported
    return isOn(entity) ? 100 : 1
  }

  function queueBrightness(entityId: string, percent: number) {
    sliderValues = { ...sliderValues, [entityId]: percent }

    const existing = brightnessTimers.get(entityId)
    if (existing) clearTimeout(existing)

    brightnessTimers.set(
      entityId,
      setTimeout(async () => {
        brightnessTimers.delete(entityId)
        try {
          await setLightBrightness(entityId, (percent / 100) * 255)
        } catch (err) {
          console.error('Failed to set brightness', entityId, err)
        } finally {
          const next = { ...sliderValues }
          delete next[entityId]
          sliderValues = next
        }
      }, 180),
    )
  }

  async function handleToggle(entityId: string) {
    if (pressing) return
    pressing = entityId
    try {
      await toggleLight(entityId)
    } catch (err) {
      console.error('Failed to toggle light', entityId, err)
    } finally {
      pressing = null
    }
  }

  async function handleScene(entityId: string) {
    if (pressing) return
    pressing = entityId
    try {
      await turnOnScene(entityId)
    } catch (err) {
      console.error('Failed to activate scene', entityId, err)
    } finally {
      pressing = null
    }
  }

  async function handleAllOff() {
    if (pressing) return
    pressing = 'all-off'
    try {
      await turnOffLights(allLightIds)
    } catch (err) {
      console.error('Failed to turn off playroom lights', err)
    } finally {
      pressing = null
    }
  }
</script>

<section class="playroom-lights" class:any-on={anyOn}>
  <h2 class="section-label">Lights</h2>

  <div class="light-grid">
    {#each lights as { key, entityId, entity }}
      {@const on = isOn(entity)}
      {@const offline = !isEntityAvailable(entity)}
      {@const busy = pressing === entityId}
      {@const brightness = displayBrightness(entityId, entity)}
      <div class="light-card" class:light-card-on={on && !offline}>
        <button
          type="button"
          class="light-tile"
          class:light-tile-on={on && !offline}
          class:light-tile-off={!on && !offline}
          class:light-tile-disabled={offline}
          disabled={offline || Boolean(pressing)}
          onclick={() => handleToggle(entityId)}
        >
          <span class="light-glow" aria-hidden="true"></span>
          <span class="light-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="14" fill="currentColor" opacity={on ? 0.95 : 0.35} />
              {#each Array(8) as _, i}
                <rect
                  x="30"
                  y="6"
                  width="4"
                  height="12"
                  rx="2"
                  fill="currentColor"
                  opacity={on ? 1 : 0.35}
                  transform="rotate({i * 45} 32 32)"
                />
              {/each}
            </svg>
          </span>
          <span class="light-label">{playroomLightLabel(key)}</span>
          <span class="light-status">
            {#if offline}
              offline
            {:else if busy}
              …
            {:else if on}
              {brightness}%
            {:else}
              off
            {/if}
          </span>
        </button>

        <label class="brightness-row" class:brightness-row-disabled={offline}>
          <span class="brightness-label">Brightness</span>
          <input
            type="range"
            class="brightness-slider"
            min="1"
            max="100"
            step="1"
            value={brightness}
            disabled={offline || Boolean(pressing)}
            aria-label="{playroomLightLabel(key)} brightness"
            oninput={(event) => {
              const value = Number((event.currentTarget as HTMLInputElement).value)
              queueBrightness(entityId, value)
            }}
          />
          <span class="brightness-value">{brightness}%</span>
        </label>
      </div>
    {/each}
  </div>

  <div class="scene-row">
    {#each scenes as { key, entityId }}
      {@const busy = pressing === entityId}
      <button
        type="button"
        class="scene-chip"
        disabled={Boolean(pressing)}
        onclick={() => handleScene(entityId)}
      >
        {busy ? '…' : playroomSceneLabel(key)}
      </button>
    {/each}
    <button
      type="button"
      class="scene-chip scene-chip-off"
      disabled={Boolean(pressing)}
      onclick={handleAllOff}
    >
      {pressing === 'all-off' ? '…' : 'All off'}
    </button>
  </div>
</section>

<style>
  .playroom-lights {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }

  .light-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .light-card {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 0.55rem;
    border: 1px solid var(--color-border);
    border-radius: 1.25rem;
    background: color-mix(in srgb, var(--color-surface-raised) 88%, transparent);
    transition:
      border-color 0.25s ease,
      box-shadow 0.25s ease;
  }

  .light-card-on {
    border-color: color-mix(in srgb, #fbbf24 35%, var(--color-border));
    box-shadow: 0 0 28px color-mix(in srgb, #fbbf24 10%, transparent);
  }

  .light-tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 7.5rem;
    padding: 0.85rem 0.65rem 0.65rem;
    border: none;
    border-radius: 0.9rem;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    transition: transform 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .light-tile:active:not(:disabled) {
    transform: scale(0.98);
  }

  .light-tile-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .light-glow {
    position: absolute;
    inset: 8%;
    border-radius: 0.75rem;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.16) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .light-tile-on .light-glow {
    opacity: 1;
  }

  .light-icon {
    width: clamp(2.5rem, 12vw, 3.75rem);
    height: clamp(2.5rem, 12vw, 3.75rem);
    color: #fbbf24;
  }

  .light-tile-off .light-icon {
    color: var(--color-text-muted);
  }

  .light-label {
    font-size: clamp(0.95rem, 2.8vw, 1.1rem);
    font-weight: 700;
  }

  .light-status {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .brightness-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.35rem 0.15rem;
    touch-action: none;
  }

  .brightness-row-disabled {
    opacity: 0.45;
  }

  .brightness-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .brightness-value {
    min-width: 2.4rem;
    font-size: 0.78rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
    text-align: right;
  }

  .brightness-slider {
    width: 100%;
    height: 0.45rem;
    margin: 0;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-border) 80%, transparent);
    appearance: none;
    cursor: pointer;
  }

  .brightness-slider:disabled {
    cursor: not-allowed;
  }

  .brightness-slider::-webkit-slider-thumb {
    appearance: none;
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 50%;
    border: 2px solid #0f1419;
    background: #fbbf24;
    box-shadow: 0 0 12px color-mix(in srgb, #fbbf24 45%, transparent);
  }

  .brightness-slider::-moz-range-thumb {
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 50%;
    border: 2px solid #0f1419;
    background: #fbbf24;
    box-shadow: 0 0 12px color-mix(in srgb, #fbbf24 45%, transparent);
  }

  .scene-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .scene-chip {
    padding: 0.55rem 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    background: var(--color-surface-overlay);
    color: var(--color-text);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .scene-chip:active:not(:disabled) {
    transform: scale(0.97);
  }

  .scene-chip:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .scene-chip-off {
    border-color: color-mix(in srgb, var(--color-danger) 35%, var(--color-border));
    color: color-mix(in srgb, var(--color-danger) 85%, var(--color-text));
  }

  .any-on {
    --clock-accent: #fbbf24;
  }
</style>
