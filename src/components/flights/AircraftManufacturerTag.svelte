<script lang="ts">
  import type { AircraftManufacturer } from '../../lib/flights/types'
  import { aircraftManufacturerLabel, detectAircraftManufacturer } from '../../lib/flights/utils'

  interface Props {
    aircraftCode?: string | null
    aircraftModel?: string | null
    manufacturer?: AircraftManufacturer | null
    /** When true, only Airbus and Boeing tags are shown. */
    majorOnly?: boolean
  }

  let {
    aircraftCode = null,
    aircraftModel = '',
    manufacturer = null,
    majorOnly = false,
  }: Props = $props()

  const detected = $derived(
    manufacturer ?? detectAircraftManufacturer(aircraftCode, aircraftModel ?? ''),
  )
  const label = $derived(detected ? aircraftManufacturerLabel(detected) : null)
  const visible = $derived(
    label != null && (!majorOnly || detected === 'airbus' || detected === 'boeing'),
  )
</script>

{#if visible && detected}
  <span class="aircraft-mfr-tag" data-mfr={detected}>{label}</span>
{/if}

<style>
  .aircraft-mfr-tag {
    font-size: 0.4375rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.08rem 0.28rem;
    border-radius: 0.2rem;
    flex-shrink: 0;
    background: color-mix(in srgb, var(--color-text-muted) 18%, transparent);
    color: var(--color-text-muted);
  }

  .aircraft-mfr-tag[data-mfr='airbus'] {
    background: color-mix(in srgb, #0ea5e9 18%, transparent);
    color: #38bdf8;
  }

  .aircraft-mfr-tag[data-mfr='boeing'] {
    background: color-mix(in srgb, var(--color-accent) 18%, transparent);
    color: var(--color-accent);
  }

  .aircraft-mfr-tag[data-mfr='embraer'] {
    background: color-mix(in srgb, var(--color-success) 16%, transparent);
    color: var(--color-success);
  }
</style>
