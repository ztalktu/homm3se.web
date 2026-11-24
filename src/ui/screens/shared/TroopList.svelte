<script lang="ts">
  /** An army in a summary: the seven slots with creature and count, "empty" for a free slot. */
  import { session } from '../../../app/session.svelte';
  import type { Troop } from '../../../core/hero';
  import { creatureGroup } from '../../../data/creatures';
  import { creatureName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import { formatNumber } from '../../format';
  import TownIcon from '../hero/TownIcon.svelte';

  interface Props {
    troops: readonly (Troop | null)[];
  }

  let { troops }: Props = $props();
</script>

<ol class="troops">
  {#each troops as troop, slot (slot)}
    <li>
      {#if troop}
        <span class="troop">
          <TownIcon group={creatureGroup(troop.creatureId, session.edition)} size={18} />
          {creatureName(troop.creatureId, session.edition)}
        </span>
        <span class="count">{formatNumber(troop.count)}</span>
      {:else}
        <span class="empty">{t('hero.emptySlot')}</span>
      {/if}
    </li>
  {/each}
</ol>

<style>
  .troops {
    margin: 0;
    padding-left: var(--space-5);
    display: grid;
    gap: var(--space-1);
  }

  .troops li {
    padding-left: var(--space-1);
  }

  .troops li span:first-child {
    margin-right: var(--space-2);
  }

  .troop {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    vertical-align: middle;
  }

  .count {
    color: var(--color-label);
    font-variant-numeric: tabular-nums;
  }

  .empty {
    color: var(--color-text-muted);
  }
</style>
