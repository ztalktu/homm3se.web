<script lang="ts" generics="Id extends string">
  /**
   * Accessible tab list (WAI-ARIA tabs pattern): arrow keys, Home and End move between tabs.
   * The caller renders the panel with id `panel-{id}` and aria-labelledby `tab-{id}`.
   */
  interface TabItem {
    id: Id;
    label: string;
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
    if (!item) {
      return;
    }
    active = item.id;
    buttons[index]?.focus();
  }

  function onKeydown(event: KeyboardEvent, index: number): void {
    const last = items.length - 1;
    const next: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
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
      onclick={() => (active = item.id)}
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

  .tab:hover {
    color: var(--color-text);
  }

  .tab[aria-selected='true'] {
    background: var(--color-panel);
    border-color: var(--color-frame);
    color: var(--color-heading);
    /* Overlap the panel frame so the active tab merges with its panel. */
    margin-bottom: -1px;
  }
</style>
