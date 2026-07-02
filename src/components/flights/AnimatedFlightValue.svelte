<script lang="ts">
  interface Props {
    value: string | number
    class?: string
  }

  let { value, class: className = '' }: Props = $props()
</script>

{#key value}
  <span class="animated-flight-value {className}">{value}</span>
{/key}

<style>
  .animated-flight-value {
    display: inline-block;
    animation: flight-value-enter 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes flight-value-enter {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .animated-flight-value {
      animation: none;
    }
  }
</style>
