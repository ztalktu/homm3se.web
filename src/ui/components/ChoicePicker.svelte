<script lang="ts" generics="Value extends string | null">
  /**
   * A row of small icon buttons, one choice at most: a click picks an option, a second click on
   * the same one clears the choice (player flags, towns).
   */
  import type { Snippet } from 'svelte';
  import { tooltip } from '../actions/tooltip';

  interface Props {
    label: string;
    options: readonly Value[];
    /** The picked option, or undefined when none is. */
    selected: Value | undefined;
    optionLabel: (option: Value) => string;
    onpick: (option: Value) => void;
    icon: Snippet<[Value]>;
    /** Round buttons, for round icons such as player flags. */
    round?: boolean | undefined;
    /** Label and buttons become two cells of the parent grid, so several rows line up. */
    inlineLabel?: boolean | undefined;
    disabled?: boolean | undefined;
  }

  let {
    label,
    options,
    selected,
    optionLabel,
    onpick,
    icon,
    round = false,
    inlineLabel = false,
    disabled = false,
  }: Props = $props();
</script>

<div class="picker" class:inline={inlineLabel} class:disabled role="group" aria-label={label}>
  <span class="label">{label}</span>
  <div class="options">
    {#each options as option (option)}
      <button
        type="button"
        class="option"
        class:round
        class:dim={selected !== undefined && selected !== option}
        aria-pressed={selected === option}
        aria-label={optionLabel(option)}
        use:tooltip={optionLabel(option)}
        {disabled}
        onclick={() => onpick(option)}
      >
        {@render icon(option)}
      </button>
    {/each}
  </div>
</div>

<style>
  .picker,
  .options {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
  }

  .inline {
    display: contents;
  }

  .disabled {
    opacity: 0.55;
  }

  .label {
    margin-right: var(--space-1);
    color: var(--color-label);
    font-size: 13px;
  }

  .option {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--radius-small);
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .option.round {
    border-radius: 50%;
  }

  .option:disabled {
    cursor: not-allowed;
  }

  .option[aria-pressed='true'] {
    border-color: var(--color-frame);
  }

  .option.dim {
    opacity: 0.3;
  }
</style>
