const FRESH_MS = 2800

export function createFreshIdTracker() {
  let freshIds = $state(new Set<string>())
  const knownIds = new Set<string>()
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function markFresh(id: string) {
    freshIds.add(id)
    const existing = timers.get(id)
    if (existing) clearTimeout(existing)
    timers.set(
      id,
      setTimeout(() => {
        freshIds.delete(id)
        timers.delete(id)
        freshIds = new Set(freshIds)
      }, FRESH_MS),
    )
    freshIds = new Set(freshIds)
  }

  function sync(ids: string[]) {
    const next = new Set(ids)
    for (const id of next) {
      if (!knownIds.has(id)) markFresh(id)
    }
    knownIds.clear()
    for (const id of next) knownIds.add(id)
  }

  function has(id: string): boolean {
    return freshIds.has(id)
  }

  return {
    sync,
    has,
    get freshIds() {
      return freshIds
    },
  }
}
