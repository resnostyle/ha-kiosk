<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { aqaraPresenceLabel } from '../lib/config/types'
  import { formatAlertLabel, friendlyName, isCoverOpen, isEntityAvailable, isOn } from '../lib/ha/utils'

  interface Props {
    presenceZones: string[]
    doors: string[]
    covers: Array<{ entityId: string; label: string }>
    getEntity: (id: string) => HassEntity | undefined
  }

  let { presenceZones, doors, covers, getEntity }: Props = $props()

  interface ActiveAlert {
    id: string
    label: string
    kind: 'presence' | 'door'
  }

  const activeAlerts = $derived.by(() => {
    const alerts: ActiveAlert[] = []

    for (const id of presenceZones) {
      const entity = getEntity(id)
      if (isEntityAvailable(entity) && isOn(entity)) {
        alerts.push({
          id,
          label: aqaraPresenceLabel(id, entity),
          kind: 'presence',
        })
      }
    }

    for (const id of doors) {
      const entity = getEntity(id)
      if (isEntityAvailable(entity) && isOn(entity)) {
        alerts.push({
          id,
          label: formatAlertLabel(friendlyName(entity, 'Door'), 'door'),
          kind: 'door',
        })
      }
    }

    for (const cover of covers) {
      const entity = getEntity(cover.entityId)
      if (isEntityAvailable(entity) && isCoverOpen(entity)) {
        alerts.push({
          id: cover.entityId,
          label: cover.label,
          kind: 'door',
        })
      }
    }

    return alerts
  })
</script>

{#if activeAlerts.length > 0}
  <ul class="nest-alerts" aria-label="Active sensors">
    {#each activeAlerts as alert (alert.id)}
      <li class="nest-alert" class:nest-alert-door={alert.kind === 'door'}>
        <span class="nest-alert-dot" aria-hidden="true"></span>
        <span class="nest-alert-label">{alert.label}</span>
        <span class="nest-alert-kind">{alert.kind === 'door' ? 'Open' : 'Presence'}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .nest-alerts {
    list-style: none;
    margin: 0.5rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .nest-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.65rem;
    border-radius: 0.625rem;
    background: color-mix(in srgb, #34d399 14%, var(--color-surface-raised));
    border: 1px solid color-mix(in srgb, #34d399 28%, var(--color-border));
    font-size: 0.8rem;
  }

  .nest-alert-door {
    background: color-mix(in srgb, #fbbf24 14%, var(--color-surface-raised));
    border-color: color-mix(in srgb, #fbbf24 32%, var(--color-border));
  }

  .nest-alert-dot {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: #34d399;
    flex-shrink: 0;
  }

  .nest-alert-door .nest-alert-dot {
    background: #fbbf24;
  }

  .nest-alert-label {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nest-alert-kind {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
</style>
