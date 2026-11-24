<script lang="ts">
  /** Rows of ChoicePicker filters with `inlineLabel`: labels in one column, buttons in the next. */
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="rows">
  {@render children()}
</div>

<style>
  .rows {
    display: grid;
    grid-template-columns: max-content 1fr;
    align-items: center;
    gap: var(--space-1);
  }
</style>
