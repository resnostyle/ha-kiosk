import { entityStore } from '../ha/entities.svelte'

/** Subscribe to HA updates for this component's lifetime. */
export function useEntityStore() {
  $effect(() => entityStore.subscribe(() => {}))
  return entityStore
}
