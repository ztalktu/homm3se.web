<script lang="ts">
  /**
   * Seven army slots, each a creature and a count: a hero's army or a town's garrison. Any
   * creature the save can hold goes into any slot.
   */
  import { saveLimits, session } from '../../../app/session.svelte';
  import type { Troop } from '../../../core/hero';
  import { HERO_LIMITS, creatureProblem } from '../../../core/rules';
  import {
    TOWNS,
    creatureGroup,
    creaturesOf,
    type Creature,
    type Town,
  } from '../../../data/creatures';
  import { creatureDescription, creatureName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import Combobox from '../../components/Combobox.svelte';
  import NumberField from '../../components/NumberField.svelte';
  import type { ComboboxItem } from '../../components/combobox';
  import TownIcon from '../hero/TownIcon.svelte';

  interface Props {
    /** Always seven slots, null for an empty one. */
    troops: (Troop | null)[];
    /** Its creatures come first in the lists. */
    ownTown: Town | undefined;
    label: string;
  }

  let { troops = $bindable(), ownTown, label }: Props = $props();

  /** -1 stands for an empty slot in the list. */
  const EMPTY = -1;

  /** Index of a creature's town in the usual order; creatures without a town go last. */
  function townOrder(creature: Creature): number {
    return creature.town ? TOWNS.indexOf(creature.town) : TOWNS.length;
  }

  /**
   * The own town first, then the other towns, level 1 to 7. Within a level the sort is
   * stable and keeps the order of the creature list: base, its upgrades, then the next line
   * (the Factory has two level 7 lines, the Pirate two upgrades).
   */
  function byTownAndLevel(a: Creature, b: Creature): number {
    return (
      Number(a.town !== ownTown) - Number(b.town !== ownTown) ||
      townOrder(a) - townOrder(b) ||
      (a.level ?? 0) - (b.level ?? 0)
    );
  }

  // Only creatures the save can hold: those the edition does not know and the holes
  // New World Computing left in the list are left out.
  const limits = $derived(saveLimits());
  const items: ComboboxItem<number>[] = $derived([
    { value: EMPTY, label: t('heroDialog.noCreature') },
    ...creaturesOf(session.edition)
      .filter((creature) => creatureProblem(creature.id, session.edition, limits) === null)
      .sort(byTownAndLevel)
      .map((creature) => ({
        value: creature.id,
        label: creatureName(creature.id, session.edition),
        description: creatureDescription(creature),
        keywords: creature.town,
      })),
  ]);

  function setCreature(slot: number, creatureId: number | null): void {
    if (creatureId === null || creatureId === EMPTY) {
      troops[slot] = null;
      return;
    }
    const previous = troops[slot];
    troops[slot] = { creatureId, count: Math.max(previous?.count ?? 1, 1) };
  }
</script>

<div class="table" role="group" aria-label={label}>
  <span></span>
  <span class="head">{t('heroDialog.creature')}</span>
  <span class="head">{t('heroDialog.count')}</span>
  {#each troops as troop, slot (slot)}
    <Combobox
      label={t('heroDialog.slot', { slot: slot + 1 })}
      inlineLabel
      {items}
      value={troop?.creatureId ?? EMPTY}
      onchange={(creatureId) => setCreature(slot, creatureId)}
    >
      {#snippet before()}
        <TownIcon group={creatureGroup(troop?.creatureId, session.edition)} />
      {/snippet}
      {#snippet optionIcon(item)}
        <TownIcon group={creatureGroup(item.value, session.edition)} />
      {/snippet}
    </Combobox>
    {#if troop}
      <NumberField
        label={t('heroDialog.slotCount', { slot: slot + 1 })}
        hideLabel
        bind:value={troop.count}
        min={1}
        max={HERO_LIMITS.troopCount}
        bigStep={100}
      />
    {:else}
      <span class="empty">-</span>
    {/if}
  {/each}
</div>

<style>
  .table {
    display: grid;
    grid-template-columns: auto minmax(0, 2fr) minmax(120px, 1fr);
    gap: var(--space-2) var(--space-3);
    align-items: center;
  }

  .head {
    font-size: 13px;
    color: var(--color-label);
  }

  .empty {
    color: var(--color-text-muted);
  }
</style>
