<script lang="ts">
  import { DASHBOARDS, dashboardById, type DashboardRoute } from '../lib/routes'

  interface Props {
    current: DashboardRoute
  }

  let { current }: Props = $props()

  let open = $state(false)

  const active = $derived(dashboardById(current))

  function navigate() {
    open = false
  }

  function toggle() {
    open = !open
  }
</script>

<nav class="dashboard-nav" aria-label="Available displays">
  <button
    type="button"
    class="dashboard-nav-toggle"
    aria-expanded={open}
    aria-controls="dashboard-nav-menu"
    onclick={toggle}
  >
    <span class="dashboard-nav-toggle-label">Displays</span>
    <span class="dashboard-nav-toggle-current">{active.label}</span>
    <span class="dashboard-nav-chevron" class:open aria-hidden="true">▾</span>
  </button>

  {#if open}
    <ul id="dashboard-nav-menu" class="dashboard-nav-menu">
      {#each DASHBOARDS as dashboard (dashboard.id)}
        <li>
          <a
            href={dashboard.hash}
            class="dashboard-nav-link"
            class:active={dashboard.id === current}
            aria-current={dashboard.id === current ? 'page' : undefined}
            onclick={navigate}
          >
            <span class="dashboard-nav-link-label">{dashboard.label}</span>
            <span class="dashboard-nav-link-hint">{dashboard.hint}</span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</nav>

<style>
  .dashboard-nav {
    position: fixed;
    left: 0.75rem;
    bottom: 0.75rem;
    z-index: 40;
    max-width: min(14rem, calc(100vw - 1.5rem));
  }

  .dashboard-nav-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0.45rem 0.65rem;
    border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--color-surface-raised) 88%, transparent);
    backdrop-filter: blur(8px);
    color: var(--color-text);
    font: inherit;
    font-size: 0.75rem;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  }

  .dashboard-nav-toggle-label {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .dashboard-nav-toggle-current {
    margin-left: auto;
    font-weight: 600;
  }

  .dashboard-nav-chevron {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    transition: transform 0.15s ease;
  }

  .dashboard-nav-chevron.open {
    transform: rotate(180deg);
  }

  .dashboard-nav-menu {
    list-style: none;
    margin: 0.35rem 0 0;
    padding: 0.25rem;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--color-surface-raised) 94%, transparent);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
  }

  .dashboard-nav-link {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.5rem 0.6rem;
    border-radius: 0.5rem;
    text-decoration: none;
    color: var(--color-text);
    transition: background 0.15s ease;
  }

  .dashboard-nav-link:hover {
    background: var(--color-surface-overlay);
  }

  .dashboard-nav-link.active {
    background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface-overlay));
  }

  .dashboard-nav-link-label {
    font-size: 0.85rem;
    font-weight: 600;
  }

  .dashboard-nav-link-hint {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
</style>
