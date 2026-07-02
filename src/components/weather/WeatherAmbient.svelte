<script lang="ts">
  import type { WeatherKind } from '../../lib/weather/theme'

  interface Props {
    kind: WeatherKind
    night?: boolean
  }

  let { kind, night = false }: Props = $props()
</script>

<div class="weather-ambient" aria-hidden="true">
  {#if kind === 'clear' && !night}
    <div class="ambient-sun-glow"></div>
  {:else if kind === 'partly-cloudy'}
    <div class="cloud cloud-drift cloud-a"></div>
    <div class="cloud cloud-drift cloud-b"></div>
  {:else if kind === 'cloudy' || kind === 'fog'}
    <div class="cloud cloud-drift cloud-a cloud-lg"></div>
    <div class="cloud cloud-drift cloud-b cloud-lg"></div>
    <div class="cloud cloud-drift cloud-c"></div>
  {:else if kind === 'rain' || kind === 'storm'}
    <div class="rain-layer"></div>
    {#if kind === 'storm'}
      <div class="lightning-flash"></div>
    {/if}
  {:else if kind === 'snow'}
    <div class="snow-layer">
      {#each Array(12) as _, i}
        <span class="snowflake" style="--i: {i}"></span>
      {/each}
    </div>
  {:else if kind === 'wind'}
    <div class="wind-streaks"></div>
  {/if}

  {#if night && (kind === 'clear' || kind === 'partly-cloudy')}
    <div class="stars">
      {#each [12, 28, 45, 62, 78, 22, 55, 88] as left, i}
        <span class="star" style="left: {left}%; top: {8 + (i % 3) * 12}%"></span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .weather-ambient {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    border-radius: inherit;
  }

  .ambient-sun-glow {
    position: absolute;
    top: -25%;
    right: -15%;
    width: 60%;
    aspect-ratio: 1;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, transparent 68%);
    animation: sun-pulse 6s ease-in-out infinite;
  }

  .cloud {
    position: absolute;
    width: 40%;
    height: 18%;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 50%;
    filter: blur(8px);
  }

  .cloud::before,
  .cloud::after {
    content: '';
    position: absolute;
    background: inherit;
    border-radius: 50%;
  }

  .cloud::before {
    width: 55%;
    height: 140%;
    left: 10%;
    top: -50%;
  }

  .cloud::after {
    width: 45%;
    height: 120%;
    right: 5%;
    top: -35%;
  }

  .cloud-lg {
    width: 50%;
    height: 22%;
    background: rgba(255, 255, 255, 0.08);
  }

  .cloud-a {
    top: 8%;
    left: -15%;
    animation: cloud-drift 28s linear infinite;
  }

  .cloud-b {
    top: 22%;
    left: 40%;
    animation: cloud-drift 36s linear infinite reverse;
    opacity: 0.7;
  }

  .cloud-c {
    top: 5%;
    right: -20%;
    animation: cloud-drift 32s linear infinite;
    opacity: 0.5;
  }

  .rain-layer {
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      105deg,
      transparent,
      transparent 4px,
      rgba(56, 189, 248, 0.08) 4px,
      rgba(56, 189, 248, 0.08) 5px
    );
    animation: rain-fall 0.8s linear infinite;
  }

  .lightning-flash {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0);
    animation: lightning 8s ease-in-out infinite;
  }

  .snow-layer {
    position: absolute;
    inset: 0;
  }

  .snowflake {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    left: calc(var(--i) * 8.3%);
    top: -5%;
    animation: snow-fall calc(4s + var(--i) * 0.3s) linear infinite;
    animation-delay: calc(var(--i) * -0.5s);
    opacity: 0.6;
  }

  .wind-streaks {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -8deg,
      transparent,
      transparent 30px,
      rgba(94, 184, 255, 0.04) 30px,
      rgba(94, 184, 255, 0.04) 32px
    );
    animation: wind-sweep 3s ease-in-out infinite;
  }

  .stars .star {
    position: absolute;
    width: 3px;
    height: 3px;
    background: white;
    border-radius: 50%;
    opacity: 0.5;
    animation: star-twinkle 2.5s ease-in-out infinite;
  }

  .stars .star:nth-child(1) { animation-delay: 0s; }
  .stars .star:nth-child(2) { animation-delay: 0.3s; }
  .stars .star:nth-child(3) { animation-delay: 0.6s; }
  .stars .star:nth-child(4) { animation-delay: 0.9s; }
  .stars .star:nth-child(5) { animation-delay: 1.2s; }
  .stars .star:nth-child(6) { animation-delay: 0.15s; }
  .stars .star:nth-child(7) { animation-delay: 0.45s; }
  .stars .star:nth-child(8) { animation-delay: 0.75s; }

  @keyframes sun-pulse {
    0%,
    100% {
      opacity: 0.85;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
  }

  @keyframes cloud-drift {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(25%);
    }
  }

  @keyframes rain-fall {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 0 40px;
    }
  }

  @keyframes lightning {
    0%,
    92%,
    100% {
      background: rgba(255, 255, 255, 0);
    }
    93% {
      background: rgba(255, 255, 255, 0.12);
    }
    94% {
      background: rgba(255, 255, 255, 0);
    }
    96% {
      background: rgba(200, 210, 255, 0.08);
    }
  }

  @keyframes snow-fall {
    to {
      transform: translateY(120vh) translateX(20px);
    }
  }

  @keyframes wind-sweep {
    0%,
    100% {
      opacity: 0.4;
      transform: translateX(0);
    }
    50% {
      opacity: 0.8;
      transform: translateX(12px);
    }
  }

  @keyframes star-twinkle {
    0%,
    100% {
      opacity: 0.2;
      transform: scale(0.8);
    }
    50% {
      opacity: 0.9;
      transform: scale(1.2);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .weather-ambient * {
      animation: none !important;
    }
  }
</style>
