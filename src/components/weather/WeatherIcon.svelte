<script lang="ts">
  import type { WeatherKind } from '../../lib/weather/theme'
  import SunIcon from './SunIcon.svelte'

  interface Props {
    kind: WeatherKind
    night?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }

  let { kind, night = false, size = 'md' }: Props = $props()

  const sizeClass = $derived(
    size === 'xl'
      ? 'weather-icon-xl'
      : size === 'lg'
        ? 'weather-icon-lg'
        : size === 'sm'
          ? 'weather-icon-sm'
          : 'weather-icon-md',
  )

  const sunPx = $derived(size === 'xl' ? 96 : size === 'lg' ? 72 : size === 'sm' ? 40 : 54)
  const sunMiniPx = $derived(size === 'lg' ? 36 : 30)
</script>

<div class="weather-icon {sizeClass} weather-icon-{kind}" class:night aria-hidden="true">
  {#if kind === 'clear' && !night}
    <SunIcon size={sunPx} />
  {:else if kind === 'clear' && night}
    <div class="icon-moon"></div>
  {:else if kind === 'partly-cloudy'}
    <div class="icon-partly">
      {#if !night}
        <div class="icon-sun-mini">
          <SunIcon size={sunMiniPx} />
        </div>
      {/if}
      <div class="icon-cloud-front"></div>
    </div>
  {:else if kind === 'cloudy' || kind === 'fog'}
    <div class="icon-cloud-stack">
      <div class="icon-cloud-back"></div>
      <div class="icon-cloud-front"></div>
    </div>
  {:else if kind === 'rain'}
    <div class="icon-rain">
      <div class="icon-cloud-front"></div>
      <div class="icon-drops">
        <span></span><span></span><span></span>
      </div>
    </div>
  {:else if kind === 'storm'}
    <div class="icon-storm">
      <div class="icon-cloud-front icon-cloud-dark"></div>
      <div class="icon-bolt"></div>
    </div>
  {:else if kind === 'snow'}
    <div class="icon-snow">
      <div class="icon-cloud-front"></div>
      <div class="icon-flakes">❄</div>
    </div>
  {:else if kind === 'wind'}
    <div class="icon-wind">
      <span class="wind-line"></span>
      <span class="wind-line"></span>
      <span class="wind-line"></span>
    </div>
  {:else}
    <div class="icon-unknown">?</div>
  {/if}
</div>

<style>
  .weather-icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .weather-icon-sm {
    width: 2.75rem;
    height: 2.75rem;
  }

  .weather-icon-md {
    width: 4.5rem;
    height: 4.5rem;
  }

  .weather-icon-lg {
    width: 6rem;
    height: 6rem;
  }

  .weather-icon-xl {
    width: 8rem;
    height: 8rem;
  }

  .icon-partly {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .icon-sun-mini {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 0;
    opacity: 0.95;
  }

  .icon-moon {
    width: 48%;
    height: 48%;
    border-radius: 50%;
    background: transparent;
    box-shadow: 0.42em -0.24em 0 0 #e8edf4;
    filter: drop-shadow(0 0 10px rgba(232, 237, 244, 0.4));
  }

  .icon-cloud-front,
  .icon-cloud-back {
    position: absolute;
    background: rgba(203, 213, 225, 0.9);
    border-radius: 50%;
  }

  .icon-cloud-front {
    width: 65%;
    height: 38%;
    bottom: 20%;
    left: 15%;
    animation: icon-cloud-bob 4s ease-in-out infinite;
  }

  .icon-cloud-front::before,
  .icon-cloud-front::after,
  .icon-cloud-back::before {
    content: '';
    position: absolute;
    background: inherit;
    border-radius: 50%;
  }

  .icon-cloud-front::before {
    width: 50%;
    height: 130%;
    left: 8%;
    top: -55%;
  }

  .icon-cloud-front::after {
    width: 42%;
    height: 110%;
    right: 8%;
    top: -40%;
  }

  .icon-cloud-back {
    width: 50%;
    height: 30%;
    bottom: 35%;
    right: 10%;
    opacity: 0.6;
    animation: icon-cloud-bob 5s ease-in-out infinite reverse;
  }

  .icon-cloud-back::before {
    width: 55%;
    height: 120%;
    left: 15%;
    top: -45%;
  }

  .icon-cloud-dark {
    background: rgba(100, 116, 139, 0.95);
  }

  .icon-cloud-stack {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .icon-rain,
  .icon-storm,
  .icon-snow {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .icon-drops {
    position: absolute;
    bottom: 5%;
    left: 25%;
    display: flex;
    gap: 18%;
    width: 50%;
  }

  .icon-drops span {
    width: 3px;
    height: 14px;
    background: #38bdf8;
    border-radius: 2px;
    animation: icon-drop 1.2s ease-in infinite;
  }

  .icon-drops span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .icon-drops span:nth-child(3) {
    animation-delay: 0.4s;
  }

  .icon-bolt {
    position: absolute;
    bottom: 8%;
    left: 38%;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 4px solid transparent;
    border-top: 18px solid #fbbf24;
    transform: skewX(-12deg);
    animation: icon-bolt-flash 4s ease-in-out infinite;
    filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.8));
  }

  .icon-flakes {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1rem;
    opacity: 0.8;
    animation: icon-flake-float 2.5s ease-in-out infinite;
  }

  .icon-wind {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 70%;
  }

  .wind-line {
    display: block;
    height: 3px;
    background: linear-gradient(90deg, transparent, #5eb8ff, transparent);
    border-radius: 2px;
    animation: icon-wind-line 2s ease-in-out infinite;
  }

  .wind-line:nth-child(2) {
    width: 80%;
    margin-left: 10%;
    animation-delay: 0.3s;
  }

  .wind-line:nth-child(3) {
    width: 60%;
    margin-left: 20%;
    animation-delay: 0.6s;
  }

  .icon-unknown {
    font-size: 2rem;
    opacity: 0.4;
  }

  @keyframes icon-cloud-bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }

  @keyframes icon-drop {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(10px);
      opacity: 0.2;
    }
  }

  @keyframes icon-bolt-flash {
    0%,
    88%,
    100% {
      opacity: 0.3;
    }
    90% {
      opacity: 1;
    }
    92% {
      opacity: 0.2;
    }
    94% {
      opacity: 0.9;
    }
  }

  @keyframes icon-flake-float {
    0%,
    100% {
      transform: translateX(-50%) translateY(0);
    }
    50% {
      transform: translateX(-50%) translateY(4px);
    }
  }

  @keyframes icon-wind-line {
    0%,
    100% {
      opacity: 0.4;
      transform: translateX(-8px);
    }
    50% {
      opacity: 1;
      transform: translateX(8px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .weather-icon * {
      animation: none !important;
    }
  }
</style>
