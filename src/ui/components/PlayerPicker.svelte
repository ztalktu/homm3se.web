<script lang="ts" generics="Owner extends PlayerColor | null">
  /**
   * A row of round player flags, one choice at most: a click picks a player, a second click on
   * the same one clears the choice. A null owner is drawn as an empty dashed flag (free heroes).
   */
  import type { PlayerColor } from '../../data/players';
  import { tooltip } from '../actions/tooltip';
  import PlayerFlag from './PlayerFlag.svelte';

  interface Props {
    label: string;
    owners: readonly Owner[];
    /** The picked owner, or undefined when none is. */
    selected: Owner | undefined;
    ownerLabel: (owner: Owner) => string;
    onpick: (owner: Owner) => void;
    disabled?: boolean | undefined;
  }

  let { label, owners, selected, ownerLabel, onpick, disabled = false }: Props = $props();
</script>

<div class="owners" class:disabled role="group" aria-label={label}>
  <span class="owners-label">{label}</span>
  {#each owners as owner (owner)}
    <button
      type="button"
      class="owner"
      class:dim={selected !== undefined && selected !== owner}
      aria-pressed={selected === owner}
      aria-label={ownerLabel(owner)}
      use:tooltip={ownerLabel(owner)}
      {disabled}
      onclick={() => onpick(owner)}
    >
      <PlayerFlag color={owner} size={14} />
    </button>
  {/each}
</div>

<style>
  .owners {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
  }

  .disabled {
    opacity: 0.55;
  }

  .owners-label {
    margin-right: var(--space-1);
    color: var(--color-label);
    font-size: 13px;
  }

  .owner {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 50%;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .owner:disabled {
    cursor: not-allowed;
  }

  .owner[aria-pressed='true'] {
    border-color: var(--color-frame);
  }

  .owner.dim {
    opacity: 0.3;
  }
</style>
