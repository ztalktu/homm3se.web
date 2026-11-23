<script lang="ts" generics="Id extends string">
  /**
   * Accessible tab list (WAI-ARIA tabs pattern): arrow keys, Home and End move between tabs.
   * The caller renders the panel with id `panel-{id}` and aria-labelledby `tab-{id}`.
   * A disabled tab stays visible with a hint why; it cannot be picked, the arrows skip it.
   */
  import { tooltip } from '../actions/tooltip';

  interface TabItem {
    id: Id;
    label: string;
    disabled?: boolean | undefined;
    /** Shown on hover; for a disabled tab, what to do first. */
    hint?: string | undefined;
  }

  interface Props {
    items: TabItem[];
    active: Id;
    label: string;
  }

  let { items, active = $bindable(), label }: Props = $props();

  // Only read in event handlers, so it does not need to be reactive.
  const buttons: HTMLButtonElement[] = [];

  function select(index: number): void {
    const item = items[index];
    if (!item || item.disabled) {
      return;
    }
    active = item.id;
    buttons[index]?.focus();
  }

  /** The next tab that can be picked from `index` in `step` direction, wrapping around. */
  function nextEnabled(index: number, step: 1 | -1): number {
    for (let offset = 1; offset <= items.length; offset += 1) {
      const candidate = (index + step * offset + items.length) % items.length;
      if (!items[candidate]?.disabled) {
        return candidate;
      }
    }
    return index;
  }

  function onKeydown(event: KeyboardEvent, index: number): void {
    const next: Record<string, number> = {
      ArrowRight: nextEnabled(index, 1),
      ArrowLeft: nextEnabled(index, -1),
      Home: nextEnabled(-1, 1),
      End: nextEnabled(items.length, -1),
    };
    const target = next[event.key];
    if (target !== undefined) {
      event.preventDefault();
      select(target);
    }
  }
</script>

<div class="tabs" role="tablist" aria-label={label}>
  {#each items as item, index (item.id)}
    <button
      bind:this={buttons[index]}
      type="button"
      role="tab"
      id={`tab-${item.id}`}
      class="tab"
      aria-selected={item.id === active}
      aria-controls={`panel-${item.id}`}
      tabindex={item.id === active ? 0 : -1}
      aria-disabled={item.disabled}
      use:tooltip={item.hint}
      onclick={() => select(index)}
      onkeydown={(event) => onKeydown(event, index)}
    >
      {item.label}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    gap: var(--space-1);
    flex-wrap: wrap;
    /* A screen can line the tabs up with its own edge through --tabs-inset. */
    padding: 0 var(--tabs-inset, var(--space-4));
  }

  .tab {
    flex: none;
    padding: var(--space-2) var(--space-4);
    border: 1px solid transparent;
    border-bottom: 0;
    border-radius: var(--radius) var(--radius) 0 0;
    background: transparent;
    color: var(--color-tab-inactive);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .tab:hover:not([aria-disabled='true']) {
    color: var(--color-text);
  }

  /* Not disabled for the browser, so the hint still shows on hover. */
  .tab[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tab[aria-selected='true'] {
    background: var(--color-panel);
    border-color: var(--color-frame);
    color: var(--color-heading);
    /* Overlap the panel frame so the active tab merges with its panel. */
    margin-bottom: -1px;
  }
</style>
