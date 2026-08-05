<script lang="ts">
  interface Props {
    settled?: boolean
  }

  let { settled = false }: Props = $props()
</script>

<div class="playroom-backdrop" class:settled aria-hidden="true">
  <div class="backdrop-glow backdrop-glow-a"></div>
  <div class="backdrop-glow backdrop-glow-b"></div>

  <div class="backdrop-orbs">
    {#each Array(7) as _, i}
      <span
        class="orb"
        style="--i: {i}; left: {8 + ((i * 13) % 78)}%; top: {12 + ((i * 17) % 70)}%; animation-duration: {18 + i * 3}s; animation-delay: {-i * 2.4}s"
      ></span>
    {/each}
  </div>

  <div class="backdrop-stars">
    {#each Array(18) as _, i}
      <span
        class="star"
        style="--i: {i}; left: {(i * 19.3) % 100}%; top: {(i * 11.7) % 100}%; animation-duration: {2.4 + (i % 5) * 0.5}s; animation-delay: {-i * 0.35}s"
      ></span>
    {/each}
  </div>

  <div class="backdrop-shimmer"></div>
</div>

<style>
  .playroom-backdrop {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    background: radial-gradient(ellipse at 25% 0%, #1a2744 0%, #0f1419 62%);
    transition: background 1.8s ease;
  }

  .playroom-backdrop.settled {
    background: radial-gradient(ellipse at 50% 20%, #24314f 0%, #0a0e14 72%);
  }

  .backdrop-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.35;
    animation: glow-drift 28s ease-in-out infinite;
  }

  .backdrop-glow-a {
    width: 42vw;
    height: 42vw;
    top: -8%;
    left: -6%;
    background: color-mix(in srgb, var(--clock-accent, #5eb8ff) 55%, transparent);
  }

  .backdrop-glow-b {
    width: 36vw;
    height: 36vw;
    right: -8%;
    bottom: 8%;
    background: color-mix(in srgb, #a78bfa 40%, transparent);
    animation-delay: -10s;
    animation-duration: 34s;
  }

  .settled .backdrop-glow-a {
    background: color-mix(in srgb, var(--clock-accent, #fbbf24) 50%, transparent);
  }

  .backdrop-orbs {
    position: absolute;
    inset: 0;
  }

  .orb {
    position: absolute;
    width: calc(3.5rem + var(--i) * 1.2rem);
    height: calc(3.5rem + var(--i) * 1.2rem);
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--clock-accent, #5eb8ff) 18%, transparent);
    background: color-mix(in srgb, var(--clock-accent, #5eb8ff) 6%, transparent);
    animation: orb-float ease-in-out infinite;
  }

  .settled .orb {
    border-color: color-mix(in srgb, var(--clock-accent, #fbbf24) 22%, transparent);
    background: color-mix(in srgb, var(--clock-accent, #fbbf24) 8%, transparent);
    animation-duration: calc(12s + var(--i) * 2s);
  }

  .backdrop-stars {
    position: absolute;
    inset: 0;
    opacity: 0.45;
  }

  .star {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: white;
    animation: star-twinkle ease-in-out infinite;
  }

  .settled .backdrop-stars {
    opacity: 0.75;
  }

  .backdrop-shimmer {
    position: absolute;
    inset: -50% -20%;
    background: linear-gradient(
      115deg,
      transparent 42%,
      color-mix(in srgb, white 4%, transparent) 50%,
      transparent 58%
    );
    animation: shimmer-pass 16s ease-in-out infinite;
    opacity: 0.35;
  }

  .settled .backdrop-shimmer {
    animation-duration: 11s;
    opacity: 0.55;
  }

  @keyframes glow-drift {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(4%, 6%) scale(1.08);
    }
  }

  @keyframes orb-float {
    0%,
    100% {
      transform: translate(0, 0) rotate(0deg);
    }
    33% {
      transform: translate(12px, -18px) rotate(4deg);
    }
    66% {
      transform: translate(-10px, 14px) rotate(-3deg);
    }
  }

  @keyframes star-twinkle {
    0%,
    100% {
      opacity: 0.15;
      transform: scale(0.8);
    }
    50% {
      opacity: 0.95;
      transform: scale(1.2);
    }
  }

  @keyframes shimmer-pass {
    0%,
    100% {
      transform: translateX(-12%) rotate(8deg);
    }
    50% {
      transform: translateX(12%) rotate(8deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .playroom-backdrop * {
      animation: none !important;
    }
  }
</style>
