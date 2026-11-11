<script lang="ts">
  /**
   * The search block shared by the hero and resource editors: fields, "Find" and, unless
   * `findNextLabel` is left out, "Find next", and where the last hit sits in the file. Enter in
   * a field submits the form, so it runs "Find" once; the buttons do not add a second search.
   */
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import Fieldset from './Fieldset.svelte';

  interface Props {
    legend: string;
    findLabel: string;
    /** Leave out for a single button that continues the search by itself. */
    findNextLabel?: string | undefined;
    /** Percent of the file before the last hit, or null when nothing has been found yet. */
    percent: number | null;
    positionText: string;
    onfind: (next: boolean) => void;
    children: Snippet;
  }

  let { legend, findLabel, findNextLabel, percent, positionText, onfind, children }: Props =
    $props();

  function onsubmit(event: SubmitEvent): void {
    event.preventDefault();
    onfind(false);
  }
</script>

<Fieldset {legend}>
  <form class="search" {onsubmit}>
    {@render children()}
    <div class="buttons">
      <Button type="submit" variant="primary" icon="search">{findLabel}</Button>
      {#if findNextLabel}
        <Button icon="search" disabled={percent === null} onclick={() => onfind(true)}>
          {findNextLabel}
        </Button>
      {/if}
    </div>
    {#if percent !== null}
      <div class="progress" aria-hidden="true"><span style:width={`${percent}%`}></span></div>
      <p class="note">{positionText}</p>
    {/if}
  </form>
</Fieldset>

<style>
  .search {
    display: grid;
    gap: var(--space-3);
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .progress {
    height: 6px;
    border: 1px solid var(--color-frame-soft);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress span {
    display: block;
    height: 100%;
    background: var(--color-frame);
  }

  .note {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted);
  }
</style>
