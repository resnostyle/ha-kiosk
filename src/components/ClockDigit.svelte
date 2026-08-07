<script lang="ts">
  interface Props {
    char: string
    size?: 'lg' | 'sm'
  }

  let { char, size = 'lg' }: Props = $props()
</script>

<span class="clock-digit" class:clock-digit-sm={size === 'sm'}>
  <span class="clock-digit-shell" aria-hidden="true"></span>
  <span class="clock-digit-frame">
    {#key char}
      <span class="clock-digit-value">{char}</span>
    {/key}
  </span>
</span>

<style>
  .clock-digit {
    position: relative;
    display: inline-flex;
    width: clamp(2.4rem, 7.5vw, 3.65rem);
    height: clamp(3rem, 9.5vw, 4.6rem);
  }

  .clock-digit-sm {
    width: clamp(1.55rem, 4.8vw, 2.15rem);
    height: clamp(2rem, 6vw, 2.65rem);
  }

  .clock-digit-shell {
    position: absolute;
    inset: 0;
    border-radius: 0.85rem;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-surface-overlay) 92%, white 8%) 0%,
      color-mix(in srgb, var(--color-surface-raised) 96%, black 4%) 100%
    );
    border: 1px solid color-mix(in srgb, var(--clock-accent, #fbbf24) 18%, var(--color-border));
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, white 8%, transparent),
      0 10px 24px -12px rgba(0, 0, 0, 0.45);
  }

  .clock-digit-sm .clock-digit-shell {
    border-radius: 0.55rem;
  }

  .clock-digit-frame {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: inherit;
  }

  .clock-digit-frame::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: color-mix(in srgb, black 28%, transparent);
    pointer-events: none;
  }

  .clock-digit-value {
    display: block;
    font-size: clamp(2rem, 6.5vw, 3.1rem);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    letter-spacing: -0.05em;
    color: var(--color-text);
    text-shadow: 0 0 28px color-mix(in srgb, var(--clock-accent, #fbbf24) 22%, transparent);
    animation: digit-flip-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .clock-digit-sm .clock-digit-value {
    font-size: clamp(1.15rem, 3.6vw, 1.55rem);
  }

  @keyframes digit-flip-in {
    0% {
      opacity: 0;
      transform: translateY(72%) rotateX(-68deg);
      filter: blur(2px);
    }
    100% {
      opacity: 1;
      transform: translateY(0) rotateX(0);
      filter: blur(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .clock-digit-value {
      animation: none;
    }
  }
</style>
