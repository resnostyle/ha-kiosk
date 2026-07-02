<script lang="ts">
  interface Props {
    compact?: boolean
    nest?: boolean
    kiosk?: boolean
  }

  let { compact = false, nest = false, kiosk = false }: Props = $props()

  let now = $state(new Date())

  $effect(() => {
    const id = setInterval(() => {
      now = new Date()
    }, 1000)
    return () => clearInterval(id)
  })

  const timeFmt = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
</script>

<header
  class="clock-header"
  class:clock-compact={compact && !nest && !kiosk}
  class:clock-nest={nest}
  class:clock-kiosk={kiosk}
>
  <p class="clock-time">{timeFmt.format(now)}</p>
  <p class="clock-date">{dateFmt.format(now)}</p>
</header>

<style>
  .clock-header {
    text-align: center;
  }

  .clock-time {
    margin: 0;
    font-weight: 600;
    letter-spacing: -0.03em;
    color: var(--color-text);
    font-size: 2.25rem;
    line-height: 1.1;
  }

  .clock-date {
    margin: 0.35rem 0 0;
    color: var(--color-text-muted);
    font-size: 1.125rem;
    line-height: 1.3;
  }

  .clock-compact .clock-time {
    font-size: 1.5rem;
  }

  .clock-compact .clock-date {
    font-size: 0.875rem;
    margin-top: 0.2rem;
  }

  .clock-kiosk {
    text-align: left;
    min-width: 0;
  }

  .clock-kiosk .clock-time {
    font-size: clamp(1.75rem, 4.5vw, 2.75rem);
    line-height: 1.05;
  }

  .clock-kiosk .clock-date {
    font-size: 0.8125rem;
    margin-top: 0.15rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .clock-nest {
    text-align: center;
  }

  .clock-nest .clock-time {
    font-size: clamp(3rem, 10vw, 4.5rem);
    font-weight: 700;
  }

  .clock-nest .clock-date {
    font-size: clamp(1.1rem, 3.5vw, 1.5rem);
    margin-top: 0.5rem;
  }

  @media (min-width: 900px) and (max-height: 700px) {
    .clock-nest {
      text-align: left;
    }

    .clock-nest .clock-time {
      font-size: 4rem;
    }

    .clock-nest .clock-date {
      font-size: 1.35rem;
    }
  }
</style>
