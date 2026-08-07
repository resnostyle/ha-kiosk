<script lang="ts">
  import ChoreChecklist from '../components/ChoreChecklist.svelte'
  import ClockHeader from '../components/ClockHeader.svelte'
  import ConnectionBanner from '../components/ConnectionBanner.svelte'
  import EveningAlerts from '../components/EveningAlerts.svelte'
  import PeopleRow from '../components/PeopleRow.svelte'
  import TomorrowStrip from '../components/TomorrowStrip.svelte'
  import WeatherNest from '../components/weather/WeatherNest.svelte'
  import { entityConfig, eveningCoverLabel } from '../lib/config/types'
  import { isAfterEvening, isBeforeEvening, isEveningWindow } from '../lib/evening/time'
  import { useEntityStore } from '../lib/ha/useEntityStore.svelte'

  const store = useEntityStore()
  const evening = entityConfig.evening

  let now = $state(new Date())

  $effect(() => {
    const id = setInterval(() => {
      now = new Date()
    }, 30_000)
    return () => clearInterval(id)
  })

  const inEveningWindow = $derived(isEveningWindow(now))
  const afterEvening = $derived(isAfterEvening(now))
  const beforeEvening = $derived(isBeforeEvening(now))

  const people = $derived(
    entityConfig.people.map((entityId) => ({
      entityId,
      entity: store.entity(entityId),
    })),
  )

  const coverAlerts = $derived(
    (Object.entries(evening.security.covers) as Array<[string, string]>).map(
      ([key, entityId]) => ({
        entityId,
        label: eveningCoverLabel(key),
      }),
    ),
  )

  const lockAlerts = $derived(
    (Object.entries(evening.security.locks ?? {}) as Array<[string, string]>).map(
      ([key, entityId]) => ({
        entityId,
        label: eveningCoverLabel(key),
      }),
    ),
  )

  const todoAlerts = $derived(
    Object.entries(evening.todos ?? {}).map(([key, entityId]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      entity: store.entity(entityId),
    })),
  )
</script>

<div class="evening-page">
  <ConnectionBanner status={store.status} error={store.error} />

  <div class="evening-grid">
    <header class="evening-top">
      <p class="evening-room">Good evening</p>
      {#if beforeEvening}
        <p class="evening-window-note">Full board at 9:00 PM</p>
      {:else if afterEvening}
        <p class="evening-window-note">Wind-down after 10:00 PM</p>
      {/if}
    </header>

    <div class="evening-clock">
      <ClockHeader nest />
    </div>

    <div class="evening-side">
      <WeatherNest entity={store.entity(entityConfig.weather)} compact />
      <TomorrowStrip
        weatherEntityId={entityConfig.weather}
        sunriseEntity={store.entity(evening.tomorrow.sunrise)}
        workdayCalendarId={evening.tomorrow.workdayCalendar}
        personalCalendarId={evening.tomorrow.personalCalendar}
        compact
      />
      <EveningAlerts
        doors={evening.security.doors}
        covers={coverAlerts}
        locks={lockAlerts}
        alarm={store.entity(evening.security.alarm)}
        downstairsOccupancy={
          evening.security.downstairsOccupancy
            ? store.entity(evening.security.downstairsOccupancy)
            : undefined
        }
        todos={inEveningWindow ? todoAlerts : []}
        getEntity={(id) => store.entity(id)}
      />
    </div>

    <div class="evening-main">
      <PeopleRow {people} compact row />

      <ChoreChecklist
        chores={evening.chores}
        points={evening.points}
        collapsed={afterEvening}
        getEntity={(id) => store.entity(id)}
      />
    </div>
  </div>
</div>

<style>
  .evening-page {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: radial-gradient(ellipse at 20% 0%, #1a1f3d 0%, #0f1419 62%);
    touch-action: manipulation;
  }

  .evening-grid {
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
      'clock side'
      'main main';
  }

  .evening-top {
    grid-area: top;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
  }

  .evening-room {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .evening-window-note {
    margin: 0;
    font-size: 0.72rem;
    color: color-mix(in srgb, #818cf8 70%, var(--color-text-muted));
  }

  .evening-clock {
    grid-area: clock;
    display: flex;
    align-items: flex-end;
    min-height: 0;
  }

  .evening-clock :global(.clock-nest) {
    text-align: left;
    width: 100%;
  }

  .evening-side {
    grid-area: side;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    min-width: 0;
  }

  .evening-main {
    grid-area: main;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    min-width: 0;
  }

  @media (min-width: 900px) and (max-height: 700px) {
    .evening-grid {
      padding: 1rem 1.75rem 1.5rem;
      gap: 0.85rem 1.5rem;
      grid-template-columns: 1.05fr 0.95fr;
      grid-template-areas:
        'top top'
        'clock side'
        'main side';
    }

    .evening-clock :global(.clock-nest .clock-time) {
      font-size: 3.75rem;
    }
  }

  @media (max-aspect-ratio: 4/5) {
    .evening-grid {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto auto;
      grid-template-areas:
        'top'
        'clock'
        'side'
        'main';
    }

    .evening-clock :global(.clock-nest) {
      text-align: center;
    }

    .evening-clock {
      align-items: center;
    }
  }
</style>
