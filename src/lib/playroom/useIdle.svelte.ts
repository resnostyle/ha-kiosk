export function useIdle(timeoutMs: number) {
  let settled = $state(false)

  $effect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const wake = () => {
      settled = false
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        settled = true
      }, timeoutMs)
    }

    const events = ['pointerdown', 'touchstart', 'keydown'] as const
    for (const event of events) {
      window.addEventListener(event, wake, { passive: true })
    }

    wake()

    return () => {
      if (timer) clearTimeout(timer)
      for (const event of events) {
        window.removeEventListener(event, wake)
      }
    }
  })

  return {
    get settled() {
      return settled
    },
  }
}
