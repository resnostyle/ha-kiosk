<script lang="ts">
  import { onMount } from 'svelte'
  import type { FeedItem } from '../../lib/playroom/rss'
  import type { PlayroomFeedConfig } from '../../lib/config/types'
  import { fetchFeedItems, shuffleItems, staticSpotlightItems } from '../../lib/playroom/rss'

  interface Props {
    feeds?: PlayroomFeedConfig[]
    facts?: string[]
    greetings?: string[]
    cycleSeconds?: number
    settled?: boolean
  }

  let {
    feeds = [],
    facts = [],
    greetings = [],
    cycleSeconds = 10,
    settled = false,
  }: Props = $props()

  let items = $state<FeedItem[]>([])
  let index = $state(0)
  let loading = $state(false)

  const current = $derived(items[index] ?? null)

  async function loadItems() {
    loading = true
    const pool = staticSpotlightItems(facts, greetings)

    const feedResults = await Promise.all(feeds.map((feed) => fetchFeedItems(feed)))
    for (const result of feedResults) {
      pool.push(...result)
    }

    items = pool.length > 0 ? shuffleItems(pool) : []
    index = 0
    loading = false
  }

  onMount(() => {
    void loadItems()
    const refresh = setInterval(() => {
      void loadItems()
    }, 30 * 60 * 1000)
    return () => clearInterval(refresh)
  })

  $effect(() => {
    if (items.length <= 1) return

    const id = setInterval(() => {
      index = (index + 1) % items.length
    }, cycleSeconds * 1000)

    return () => clearInterval(id)
  })
</script>

<aside class="playroom-spotlight" class:settled aria-live="polite">
  <div class="spotlight-track">
    <span class="spotlight-label">
      {#if loading && !current}
        Loading stories…
      {:else if current}
        {current.source}
      {:else}
        Playroom
      {/if}
    </span>

    <div class="spotlight-content">
      {#if current}
        {#key current.title + current.source}
          <p class="spotlight-text">{current.title}</p>
        {/key}
      {:else}
        <p class="spotlight-text spotlight-text-muted">Tap anywhere to wake the board</p>
      {/if}
    </div>

    {#if items.length > 1}
      <div class="spotlight-dots" aria-hidden="true">
        {#each items.slice(0, Math.min(items.length, 8)) as _, dotIndex}
          <span class="dot" class:active={dotIndex === index % 8}></span>
        {/each}
      </div>
    {/if}
  </div>
</aside>

<style>
  .playroom-spotlight {
    width: 100%;
    opacity: 0.85;
    transition:
      opacity 1s ease,
      transform 1s ease;
  }

  .playroom-spotlight.settled {
    opacity: 1;
  }

  .spotlight-track {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.95rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--clock-accent, #5eb8ff) 22%, var(--color-border));
    background: color-mix(in srgb, var(--color-surface-raised) 82%, transparent);
    backdrop-filter: blur(12px);
    box-shadow: 0 12px 32px -16px rgba(0, 0, 0, 0.55);
  }

  .settled .spotlight-track {
    border-color: color-mix(in srgb, var(--clock-accent, #fbbf24) 28%, var(--color-border));
    box-shadow: 0 16px 40px -14px rgba(0, 0, 0, 0.65);
  }

  .spotlight-label {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--clock-accent, #5eb8ff) 75%, var(--color-text-muted));
    white-space: nowrap;
  }

  .spotlight-content {
    min-width: 0;
    overflow: hidden;
  }

  .spotlight-text {
    margin: 0;
    font-size: clamp(0.88rem, 2.4vw, 1.05rem);
    font-weight: 600;
    line-height: 1.35;
    color: var(--color-text);
    animation: spotlight-in 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .spotlight-text-muted {
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .spotlight-dots {
    display: inline-flex;
    gap: 0.28rem;
  }

  .dot {
    width: 0.35rem;
    height: 0.35rem;
    border-radius: 50%;
    background: color-mix(in srgb, var(--color-text-muted) 35%, transparent);
    transition: background 0.25s ease, transform 0.25s ease;
  }

  .dot.active {
    background: var(--clock-accent, #5eb8ff);
    transform: scale(1.25);
  }

  @keyframes spotlight-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spotlight-text {
      animation: none;
    }
  }

  @media (max-width: 640px) {
    .spotlight-track {
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }

    .spotlight-dots {
      justify-content: flex-start;
    }
  }
</style>
