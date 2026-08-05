<script lang="ts">
  import ClockDigit from './ClockDigit.svelte'

  interface Props {
    size?: 'nest' | 'hero'
  }

  let { size = 'hero' }: Props = $props()

  let now = $state(new Date())
  let smoothSecond = $state(0)

  $effect(() => {
    const tick = () => {
      const current = new Date()
      now = current
      smoothSecond = current.getSeconds() + current.getMilliseconds() / 1000
    }

    tick()
    const id = window.setInterval(tick, 50)
    return () => window.clearInterval(id)
  })

  const hours = $derived(
    now.toLocaleString('en-US', { hour: 'numeric', hour12: true }).replace(/\s?[AP]M$/, ''),
  )
  const minutes = $derived(String(now.getMinutes()).padStart(2, '0'))
  const seconds = $derived(String(now.getSeconds()).padStart(2, '0'))
  const ampm = $derived(
    now.toLocaleString('en-US', { hour: 'numeric', hour12: true }).split(' ').pop() ?? '',
  )
  const day = $derived(now.toLocaleString('en-US', { weekday: 'long' }))
  const date = $derived(now.toLocaleString('en-US', { month: 'long', day: 'numeric' }))

  const hourChars = $derived(hours.split(''))
  const minuteChars = $derived(minutes.split(''))
  const secondChars = $derived(seconds.split(''))

  const ringRadius = 54
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = $derived(ringCircumference * (1 - smoothSecond / 60))
</script>

<div class="animated-clock" class:clock-nest={size === 'nest'} class:clock-hero={size === 'hero'}>
  <div class="clock-shell">
    <svg class="clock-ring" viewBox="0 0 120 120" aria-hidden="true">
      <circle
        class="clock-ring-track"
        cx="60"
        cy="60"
        r={ringRadius}
        fill="none"
        stroke-width="3"
      />
      <circle
        class="clock-ring-progress"
        cx="60"
        cy="60"
        r={ringRadius}
        fill="none"
        stroke-width="3"
        stroke-dasharray={ringCircumference}
        stroke-dashoffset={ringOffset}
        transform="rotate(-90 60 60)"
      />
    </svg>

    <div class="clock-main" aria-live="polite">
      <div class="clock-time-row">
        <div class="clock-group" aria-label="Hours">
          {#each hourChars as digit, index (index)}
            <ClockDigit char={digit} />
          {/each}
        </div>

        <span class="clock-separator" aria-hidden="true">:</span>

        <div class="clock-group" aria-label="Minutes">
          {#each minuteChars as digit, index (index)}
            <ClockDigit char={digit} />
          {/each}
        </div>

        <div class="clock-side">
          <div class="clock-seconds" aria-label="Seconds">
            {#each secondChars as digit, index (index)}
              <ClockDigit char={digit} size="sm" />
            {/each}
          </div>
          <span class="clock-ampm">{ampm}</span>
        </div>
      </div>

      <div class="clock-date">
        <p class="clock-day">{day}</p>
        <p class="clock-full-date">{date}</p>
      </div>
    </div>
  </div>
</div>

<style>
  .animated-clock {
    position: relative;
    width: 100%;
    min-width: 0;
  }

  .clock-shell {
    position: relative;
    padding: 1rem 1rem 0.95rem;
    border-radius: 1.5rem;
    border: 1px solid color-mix(in srgb, var(--clock-accent, #fbbf24) 20%, var(--color-border));
    background:
      radial-gradient(
        circle at 18% 0%,
        color-mix(in srgb, var(--clock-accent, #fbbf24) 12%, transparent) 0%,
        transparent 52%
      ),
      linear-gradient(
        165deg,
        color-mix(in srgb, var(--color-surface-raised) 92%, white 8%) 0%,
        color-mix(in srgb, var(--color-surface) 96%, black 4%) 100%
      );
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, white 7%, transparent),
      0 18px 40px -20px rgba(0, 0, 0, 0.55);
    overflow: hidden;
  }

  .clock-ring {
    position: absolute;
    top: -1.1rem;
    right: -1.1rem;
    width: 7.5rem;
    height: 7.5rem;
    opacity: 0.9;
    pointer-events: none;
  }

  .clock-ring-track {
    stroke: color-mix(in srgb, var(--color-border) 80%, transparent);
  }

  .clock-ring-progress {
    stroke: var(--clock-accent, #fbbf24);
    stroke-linecap: round;
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--clock-accent, #fbbf24) 45%, transparent));
    transition: stroke-dashoffset 80ms linear;
  }

  .clock-main {
    position: relative;
    z-index: 1;
  }

  .clock-time-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: nowrap;
  }

  .clock-group,
  .clock-seconds {
    display: inline-flex;
    gap: 0.28rem;
  }

  .clock-separator {
    font-size: clamp(2rem, 6vw, 3rem);
    font-weight: 700;
    line-height: 1;
    color: color-mix(in srgb, var(--clock-accent, #fbbf24) 88%, var(--color-text));
    animation: separator-pulse 1s ease-in-out infinite;
    transform: translateY(-0.08em);
    margin: 0 0.05rem;
  }

  .clock-side {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
    margin-left: 0.45rem;
    padding-left: 0.55rem;
    border-left: 1px solid color-mix(in srgb, var(--color-border) 75%, transparent);
  }

  .clock-ampm {
    font-size: clamp(0.72rem, 2.2vw, 0.9rem);
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--clock-accent, #fbbf24) 65%, var(--color-text-muted));
    padding-left: 0.1rem;
  }

  .clock-date {
    margin-top: 0.9rem;
    padding-top: 0.75rem;
    border-top: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  }

  .clock-day,
  .clock-full-date {
    margin: 0;
    line-height: 1.25;
  }

  .clock-day {
    font-size: clamp(1rem, 2.8vw, 1.35rem);
    font-weight: 600;
    color: var(--color-text);
  }

  .clock-full-date {
    margin-top: 0.18rem;
    font-size: clamp(0.88rem, 2.4vw, 1.05rem);
    color: var(--color-text-muted);
  }

  .clock-nest .clock-shell {
    padding: 0.85rem 0.9rem 0.8rem;
  }

  .clock-nest .clock-ring {
    width: 6rem;
    height: 6rem;
  }

  @keyframes separator-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.22;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .clock-separator,
    .clock-ring-progress {
      animation: none;
      transition: none;
    }
  }

  @media (max-width: 420px) {
    .clock-time-row {
      flex-wrap: wrap;
      row-gap: 0.55rem;
    }

    .clock-side {
      flex-direction: row;
      align-items: center;
      margin-left: 0;
      padding-left: 0;
      border-left: none;
      width: 100%;
    }
  }
</style>
