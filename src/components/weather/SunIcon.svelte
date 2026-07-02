<script lang="ts">
  interface Props {
    size?: number
    animate?: boolean
  }

  let { size = 64, animate = true }: Props = $props()

  const rays = Array.from({ length: 12 }, (_, i) => i * 30)
  const uid = `sun-${crypto.randomUUID().slice(0, 8)}`
</script>

<svg
  class="sun-icon"
  class:animate={animate}
  width={size}
  height={size}
  viewBox="0 0 100 100"
  aria-hidden="true"
>
  <defs>
    <radialGradient id="{uid}-core" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="55%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </radialGradient>
    <filter id="{uid}-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <g class="sun-rays" filter="url(#{uid}-glow)">
    {#each rays as angle}
      <rect
        x="46.5"
        y="10"
        width="7"
        height="16"
        rx="3.5"
        fill="#fbbf24"
        opacity="0.95"
        transform="rotate({angle} 50 50)"
      />
    {/each}
  </g>

  <circle class="sun-core" cx="50" cy="50" r="24" fill="url(#{uid}-core)" filter="url(#{uid}-glow)" />
</svg>

<style>
  .sun-icon {
    display: block;
    overflow: visible;
  }

  .sun-rays {
    transform-origin: 50px 50px;
  }

  .sun-icon.animate .sun-rays {
    animation: sun-rays-spin 24s linear infinite;
  }

  .sun-icon.animate .sun-core {
    animation: sun-core-pulse 3.5s ease-in-out infinite;
    transform-origin: 50px 50px;
  }

  @keyframes sun-rays-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes sun-core-pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.04);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sun-icon.animate .sun-rays,
    .sun-icon.animate .sun-core {
      animation: none;
    }
  }
</style>
