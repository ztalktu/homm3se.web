<script lang="ts">
  /**
   * What an editor tab found: columns of facts (a `dl` of labels and values, `h3` headings,
   * `.muted` text) and the buttons below them.
   */
  import type { Snippet } from 'svelte';
  import Fieldset from '../../components/Fieldset.svelte';

  interface Props {
    legend: string;
    children: Snippet;
    actions?: Snippet | undefined;
  }

  let { legend, children, actions }: Props = $props();
</script>

<Fieldset {legend}>
  <div class="summary">
    {@render children()}
  </div>
  {#if actions}
    <div class="actions">
      {@render actions()}
    </div>
  {/if}
</Fieldset>

<style>
  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: var(--space-4);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .summary :global(dl) {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-1) var(--space-4);
    margin: var(--space-2) 0 0;
  }

  .summary :global(dt) {
    color: var(--color-label);
    font-size: 13px;
  }

  .summary :global(dd) {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .summary :global(h3) {
    font-size: 14px;
    margin: var(--space-2) 0 var(--space-2);
  }

  .summary :global(.muted),
  .actions :global(.muted) {
    color: var(--color-text-muted);
  }

  /* A value with an icon (a flag, a town badge) in front. */
  .summary :global(dd.with-icon) {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
</style>
