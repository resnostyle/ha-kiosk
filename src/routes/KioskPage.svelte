<script lang="ts">
  import ConnectionBanner from '../components/ConnectionBanner.svelte'
  import ClockHeader from '../components/ClockHeader.svelte'
  import LightGrid from '../components/LightGrid.svelte'
  import PeopleRow from '../components/PeopleRow.svelte'
  import PresenceBadge from '../components/PresenceBadge.svelte'
  import StatusBar from '../components/StatusBar.svelte'
  import WeatherPanel from '../components/WeatherPanel.svelte'
  import { entityConfig } from '../lib/config/types'
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
</script>

<div class="min-h-dvh p-4 pt-6 grid gap-4" style="grid-template-rows: auto 1fr auto auto auto;">
  <ConnectionBanner status={store.status} error={store.error} />

  <header class="px-1">
    <ClockHeader />
  </header>

  <div class="grid grid-cols-2 gap-4 min-h-0" style="grid-row: span 1;">
    <WeatherPanel entity={store.entity(entityConfig.weather)} />
    <PeopleRow {people} />
  </div>

  <div class="grid grid-cols-2 gap-4">
    <PresenceBadge
      entity={store.entity(entityConfig.presence.downstairs)}
      label="Downstairs"
    />
    <LightGrid {lights} />
  </div>

  <StatusBar
    alarm={store.entity(entityConfig.status.alarm)}
    guestMode={store.entity(entityConfig.status.guestMode)}
  />
</div>
