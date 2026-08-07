<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { eveningCoverLabel } from '../lib/config/types'
  import {
    formatAlertLabel,
    friendlyName,
    isCoverOpen,
    isEntityAvailable,
    isOn,
  } from '../lib/ha/utils'

  interface Props {
    doors: string[]
    covers: Array<{ entityId: string; label: string }>
    locks?: Array<{ entityId: string; label: string }>
    alarm: HassEntity | undefined
    downstairsOccupancy?: HassEntity | undefined
    todos?: Array<{ label: string; entity: HassEntity | undefined }>
    getEntity: (id: string) => HassEntity | undefined
  }

  let {
    doors,
    covers,
    locks = [],
    alarm,
    downstairsOccupancy,
    todos = [],
    getEntity,
  }: Props = $props()

  interface SecurityAlert {
    id: string
    label: string
    detail: string
    kind: 'door' | 'lock' | 'presence' | 'alarm' | 'todo'
  }

  const activeAlerts = $derived.by(() => {
    const alerts: SecurityAlert[] = []

    for (const id of doors) {
      const entity = getEntity(id)
      if (isEntityAvailable(entity) && isOn(entity)) {
        alerts.push({
          id,
          label: formatAlertLabel(friendlyName(entity, 'Door'), 'door'),
          detail: 'Open',
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
          detail: 'Open',
          kind: 'door',
        })
      }
    }

    for (const lock of locks) {
      const entity = getEntity(lock.entityId)
      if (isEntityAvailable(entity) && entity?.state === 'unlocked') {
        alerts.push({
          id: lock.entityId,
          label: lock.label,
          detail: 'Unlocked',
          kind: 'lock',
        })
      }
    }

    if (isEntityAvailable(downstairsOccupancy) && isOn(downstairsOccupancy)) {
      alerts.push({
        id: downstairsOccupancy!.entity_id,
        label: 'Downstairs',
        detail: 'Occupied',
        kind: 'presence',
      })
    }

    if (isEntityAvailable(alarm)) {
      const state = alarm?.state ?? 'unknown'
      if (state !== 'disarmed') {
        alerts.push({
          id: alarm!.entity_id,
          label: 'Alarm',
          detail: state.replace(/_/g, ' '),
          kind: 'alarm',
        })
      }
    }

    for (const todo of todos) {
      const count = Number.parseInt(todo.entity?.state ?? '0', 10)
      if (Number.isFinite(count) && count > 0) {
        alerts.push({
          id: todo.entity?.entity_id ?? todo.label,
          label: todo.label,
          detail: `${count} item${count === 1 ? '' : 's'}`,
          kind: 'todo',
        })
      }
    }

    return alerts
  })
</script>

{#if activeAlerts.length > 0}
  <ul class="evening-alerts" aria-label="House alerts">
    {#each activeAlerts as alert (alert.id)}
      <li
        class="evening-alert"
        class:evening-alert-door={alert.kind === 'door' || alert.kind === 'lock'}
        class:evening-alert-alarm={alert.kind === 'alarm'}
      >
        <span class="evening-alert-dot" aria-hidden="true"></span>
        <span class="evening-alert-label">{alert.label}</span>
        <span class="evening-alert-detail">{alert.detail}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .evening-alerts {
    list-style: none;
    margin: 0.5rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .evening-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.65rem;
    border-radius: 0.625rem;
    background: color-mix(in srgb, #34d399 14%, var(--color-surface-raised));
    border: 1px solid color-mix(in srgb, #34d399 28%, var(--color-border));
    font-size: 0.8rem;
  }

  .evening-alert-door {
    background: color-mix(in srgb, #fbbf24 14%, var(--color-surface-raised));
    border-color: color-mix(in srgb, #fbbf24 32%, var(--color-border));
  }

  .evening-alert-alarm {
    background: color-mix(in srgb, #f87171 14%, var(--color-surface-raised));
    border-color: color-mix(in srgb, #f87171 32%, var(--color-border));
  }

  .evening-alert-dot {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: #34d399;
    flex-shrink: 0;
  }

  .evening-alert-door .evening-alert-dot {
    background: #fbbf24;
  }

  .evening-alert-alarm .evening-alert-dot {
    background: #f87171;
  }

  .evening-alert-label {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .evening-alert-detail {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
</style>
