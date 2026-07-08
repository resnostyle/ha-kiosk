<script lang="ts">
  import type { HassEntity } from 'home-assistant-js-websocket'
  import { choreIsOutstanding, choreStatusLabel } from '../lib/evening/chores'
  import { eveningChoreLabel, eveningKidLabel } from '../lib/config/types'

  interface Props {
    chores: Record<string, string[]>
    points?: Record<string, string>
    getEntity: (id: string) => HassEntity | undefined
    collapsed?: boolean
  }

  let { chores, points = {}, getEntity, collapsed = false }: Props = $props()

  interface KidRow {
    key: string
    label: string
    items: Array<{ entityId: string; label: string; status: string }>
    pointsValue: string | null
  }

  const rows = $derived.by(() => {
    const result: KidRow[] = []

    for (const [kidKey, entityIds] of Object.entries(chores)) {
      const items = entityIds
        .map((entityId) => {
          const entity = getEntity(entityId)
          if (!choreIsOutstanding(entity)) return null
          return {
            entityId,
            label: eveningChoreLabel(entityId, entity),
            status: choreStatusLabel(entity),
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

      const pointsEntity = points[kidKey] ? getEntity(points[kidKey]) : undefined
      const pointsValue =
        pointsEntity && pointsEntity.state !== 'unavailable' ? pointsEntity.state : null

      result.push({
        key: kidKey,
        label: eveningKidLabel(kidKey),
        items,
        pointsValue,
      })
    }

    return result
  })

  const outstandingCount = $derived(
    rows.reduce((total, row) => total + row.items.length, 0),
  )
</script>

<section class="chore-checklist" aria-label="Evening chores">
  <div class="chore-checklist-header">
    <h2 class="chore-checklist-title">Tonight</h2>
    {#if collapsed}
      <span class="chore-checklist-note">After 10 PM</span>
    {:else if outstandingCount === 0}
      <span class="chore-checklist-note chore-checklist-done">All done</span>
    {:else}
      <span class="chore-checklist-note">{outstandingCount} left</span>
    {/if}
  </div>

  {#if !collapsed}
    {#each rows as row (row.key)}
      <div class="chore-kid">
        <div class="chore-kid-header">
          <span class="chore-kid-name">{row.label}</span>
          {#if row.pointsValue != null}
            <span class="chore-kid-points">{row.pointsValue} pts</span>
          {/if}
        </div>

        {#if row.items.length === 0}
          <p class="chore-empty">Nothing left</p>
        {:else}
          <ul class="chore-list">
            {#each row.items as item (item.entityId)}
              <li class="chore-item">
                <span class="chore-dot" aria-hidden="true"></span>
                <span class="chore-label">{item.label}</span>
                <span class="chore-status">{item.status}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  {/if}
</section>

<style>
  .chore-checklist {
    padding: 0.75rem 0.9rem;
    border-radius: 1rem;
    border: 1px solid var(--color-border);
    background: var(--color-surface-raised);
  }

  .chore-checklist-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.55rem;
  }

  .chore-checklist-title {
    margin: 0;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .chore-checklist-note {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .chore-checklist-done {
    color: var(--color-success);
    font-weight: 600;
  }

  .chore-kid + .chore-kid {
    margin-top: 0.65rem;
    padding-top: 0.65rem;
    border-top: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  }

  .chore-kid-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .chore-kid-name {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .chore-kid-points {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .chore-empty {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .chore-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .chore-item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.45rem;
    border-radius: 0.5rem;
    background: var(--color-surface-overlay);
    font-size: 0.82rem;
  }

  .chore-dot {
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: #fbbf24;
    flex-shrink: 0;
  }

  .chore-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chore-status {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
</style>
