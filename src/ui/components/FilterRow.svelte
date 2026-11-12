<script lang="ts" generics="Value extends string">
  /**
   * Single-choice filter as a centred grid of chips (spell purposes, artifact categories):
   * a click shows only that kind, clicking it again shows everything, another one switches.
   * While one is on, the others dim.
   */
  import type { Snippet } from 'svelte';
  import { tooltip } from '../actions/tooltip';

  interface Props {
    label: string;
    options: readonly Value[];
    value: Value | null;
    /** Chips per row on wide screens; narrow ones get two. */
    columns: number;
    /** Equal columns; off when the widest label would make the row too wide. */
    even?: boolean | undefined;
    hint?: ((option: Value) => string) | undefined;
    chip: Snippet<[Value]>;
  }

  let { label, options, value = $bindable(), columns, even = true, hint, chip }: Props = $props();
</script>

<div
  class="filter"
  role="group"
  aria-label={label}
  style:--columns={columns}
  style:--column={even ? '1fr' : 'auto'}
>
  {#each options as option (option)}
    <button
      type="button"
      class="chip"
      aria-pressed={value === option}
      class:dim={value !== null && value !== option}
      onclick={() => (value = value === option ? null : option)}
      use:tooltip={hint?.(option)}
    >
      {@render chip(option)}
    </button>
  {/each}
</div>

<style>
  .filter {
    display: grid;
    grid-template-columns: repeat(var(--columns), var(--column));
    width: max-content;
    max-width: 100%;
    margin-inline: auto;
    gap: var(--space-1) var(--space-2);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 0 var(--space-2) 0 3px;
    border: 1px solid var(--color-secondary-border);
    border-radius: var(--radius-small);
    background: transparent;
    color: var(--color-text);
    font-size: 13px;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .chip:hover {
    background: var(--color-secondary-hover);
    border-color: var(--color-frame);
  }

  .chip[aria-pressed='true'] {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-primary-text);
  }

  .chip.dim {
    opacity: 0.5;
  }

  @media (max-width: 640px) {
    .filter {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
