import { onMount } from 'svelte'
import { entityStore } from '../ha/entities.svelte'
import type { ConnectionStatus } from '../ha/utils'

export function useEntityStore() {
  let status = $state<ConnectionStatus>('connecting')
  let error = $state<string | null>(null)
  let tick = $state(0)

  onMount(() => {
    return entityStore.subscribe(() => {
      status = entityStore.getStatus()
      error = entityStore.getError()
      tick++
    })
  })

  return {
    get status() {
      return status
    },
    get error() {
      return error
    },
    get tick() {
      return tick
    },
    entity(entityId: string) {
      void tick
      return entityStore.getEntity(entityId)
    },
  }
}
