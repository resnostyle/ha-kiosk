<script lang="ts">
  import ConnectionBanner from '../components/ConnectionBanner.svelte'
  import KioskHeader from '../components/KioskHeader.svelte'
  import LightGrid from '../components/LightGrid.svelte'
  import PeopleRow from '../components/PeopleRow.svelte'
  import PresencePanel from '../components/PresencePanel.svelte'
  import StatusBar from '../components/StatusBar.svelte'
  import { aqaraPresenceLabel, entityConfig } from '../lib/config/types'
  import { useEntityStore } from '../lib/ha/useEntityStore.svelte'

  const store = useEntityStore()

  const people = $derived(
    entityConfig.people.map((entityId) => ({
      entityId,
      entity: store.entity(entityId),
    })),
  )

  const lights = $derived(
    (Object.entries(entityConfig.lights) as Array<[keyof typeof entityConfig.lights, string]>).map(
      ([key, entityId]) => ({
        key,
        entityId,
        entity: store.entity(entityId),
      }),
    ),
  )

  const presenceZones = $derived(
    entityConfig.aqaraPresenceZones.map((entityId) => ({
      entityId,
      entity: store.entity(entityId),
      label: aqaraPresenceLabel(entityId, store.entity(entityId)),
    })),
  )
</script>

<div class="kiosk-page">
  <ConnectionBanner status={store.status} error={store.error} />

  <KioskHeader
    entity={store.entity(entityConfig.weather)}
    weatherEntityId={entityConfig.weather}
  />

  <PeopleRow {people} row />

  <div class="kiosk-controls">
    <PresencePanel zones={presenceZones} />
    <LightGrid {lights} />
  </div>

  <StatusBar
    alarm={store.entity(entityConfig.status.alarm)}
    guestMode={store.entity(entityConfig.status.guestMode)}
  />
</div>

<style>
  .kiosk-page {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 1rem 1.25rem;
    padding-top: 1.5rem;
  }

  .kiosk-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    gap: 1rem;
    align-items: start;
  }
</style>
