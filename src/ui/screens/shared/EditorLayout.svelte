<script lang="ts">
  /** An editor tab: the search or list on the left, the summary of what was picked on the right. */
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="layout">
  {@render children()}
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(260px, max-content) minmax(0, 1fr);
    gap: var(--space-4);
    align-items: start;
  }

  @media (max-width: 900px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
