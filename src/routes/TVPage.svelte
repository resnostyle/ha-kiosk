<script lang="ts">
  import CameraStrip from '../components/CameraStrip.svelte'
  import ClockHeader from '../components/ClockHeader.svelte'
  import ConnectionBanner from '../components/ConnectionBanner.svelte'
  import PeopleRow from '../components/PeopleRow.svelte'
  import StatusBar from '../components/StatusBar.svelte'
  import WeatherHero from '../components/WeatherHero.svelte'
  import { entityConfig } from '../lib/config/types'
  import { useEntityStore } from '../lib/ha/useEntityStore.svelte'

  const store = useEntityStore()

  const people = $derived(
    entityConfig.people.map((entityId) => ({
      entityId,
      entity: store.entity(entityId),
    })),
  )
</script>

<div class="min-h-dvh p-6 grid gap-4" style="grid-template-columns: 1fr 22rem; grid-template-rows: auto 1fr auto;">
  <ConnectionBanner status={store.status} error={store.error} />

  <div class="col-span-2">
    <StatusBar
      alarm={store.entity(entityConfig.status.alarm)}
      guestMode={store.entity(entityConfig.status.guestMode)}
      ticker="Home display"
    />
  </div>

  <WeatherHero
    entity={store.entity(entityConfig.weather)}
    weatherEntityId={entityConfig.weather}
  />

  <div class="flex flex-col gap-4">
    <ClockHeader compact />
    <PeopleRow {people} compact />
    <CameraStrip
      cameraId={entityConfig.cameras.garage}
      occupancy={store.entity(entityConfig.cameraOccupancy.garage)}
      label="Garage"
    />
  </div>
</div>
