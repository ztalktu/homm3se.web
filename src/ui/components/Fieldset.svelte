<script lang="ts">
  /** Framed group of related fields with a caption, like the old GroupBox. */
  import type { Snippet } from 'svelte';

  interface Props {
    legend: string;
    children: Snippet;
  }

  let { legend, children }: Props = $props();
</script>

<fieldset>
  <legend>{legend}</legend>
  {@render children()}
</fieldset>

<style>
  fieldset {
    margin: 0;
    padding: var(--space-3) var(--space-4) var(--space-4);
    border: 1px solid var(--color-frame-soft);
    border-radius: var(--radius);
    min-width: 0;
  }

  legend {
    padding: 0 var(--space-2);
    font-family: var(--font-heading);
    font-size: 14px;
    color: var(--color-heading);
  }
</style>
