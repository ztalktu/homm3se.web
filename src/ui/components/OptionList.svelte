<script lang="ts" generics="Item">
  /**
   * A list to pick one item from, on a field background: each row is a button, the picked one
   * stands out. A row may end with a control of its own (a delete button, say).
   */
  import type { Snippet } from 'svelte';

  interface Props {
    items: readonly Item[];
    key: (item: Item) => string | number;
    selected: (item: Item) => boolean;
    label: string;
    onpick: (item: Item) => void;
    /** What a row shows. */
    row: Snippet<[Item]>;
    /** A control after the row's button. */
    trailing?: Snippet<[Item]> | undefined;
  }

  let { items, key, selected, label, onpick, row, trailing }: Props = $props();
</script>

<ul class="options" role="listbox" aria-label={label}>
  {#each items as item (key(item))}
    <li role="option" aria-selected={selected(item)}>
      <button type="button" onclick={() => onpick(item)}>{@render row(item)}</button>
      {@render trailing?.(item)}
    </li>
  {/each}
</ul>

<style>
  .options {
    list-style: none;
    margin: 0;
    padding: var(--space-1);
    max-height: 330px;
    overflow-y: auto;
    border: 1px solid var(--color-field-border);
    border-radius: var(--radius-small);
    background: var(--color-field);
    color: var(--color-field-text);
  }

  li {
    display: flex;
    align-items: center;
    border-radius: var(--radius-small);
  }

  li:hover {
    background: var(--color-option-hover);
  }

  li[aria-selected='true'] {
    background: var(--color-option-selected);
  }

  button {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
</style>
