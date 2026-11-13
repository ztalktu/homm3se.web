<script lang="ts">
  import { session } from '../../../app/session.svelte';
  import type { Hero } from '../../../core/hero';
  import { HERO_LIMITS, creatureProblem } from '../../../core/rules';
  import { CREATURES, TOWNS, creatureGroup, type Creature } from '../../../data/creatures';
  import { classTown } from '../../../data/heroClasses';
  import { creatureDescription, creatureName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import Combobox from '../../components/Combobox.svelte';
  import NumberField from '../../components/NumberField.svelte';
  import type { ComboboxItem } from '../../components/combobox';
  import TownIcon from './TownIcon.svelte';

  interface Props {
    hero: Hero;
  }

  let { hero = $bindable() }: Props = $props();

  /** -1 stands for an empty slot in the list. */
  const EMPTY = -1;

  const heroTown = $derived(classTown(hero.classId));

  /** Index of a creature's town in the usual order; creatures without a town go last. */
  function townOrder(creature: Creature): number {
    return creature.town ? TOWNS.indexOf(creature.town) : TOWNS.length;
  }

  /** The hero's own town first, then the other towns, level 1 to 7, the upgrade after its base. */
  function byTownAndLevel(a: Creature, b: Creature): number {
    return (
      Number(a.town !== heroTown) - Number(b.town !== heroTown) ||
      townOrder(a) - townOrder(b) ||
      (a.level ?? 0) - (b.level ?? 0) ||
      Number(a.upgraded ?? false) - Number(b.upgraded ?? false)
    );
  }

  // Only creatures the save can hold: those the edition does not know and the holes
  // New World Computing left in the list are left out.
  const items: ComboboxItem<number>[] = $derived([
    { value: EMPTY, label: t('heroDialog.noCreature') },
    ...CREATURES.filter((creature) => creatureProblem(creature.id, session.edition) === null)
      .sort(byTownAndLevel)
      .map((creature) => ({
        value: creature.id,
        label: creatureName(creature.id),
        description: creatureDescription(creature),
        keywords: creature.town,
      })),
  ]);

  function setCreature(slot: number, creatureId: number | null): void {
    if (creatureId === null || creatureId === EMPTY) {
      hero.troops[slot] = null;
      return;
    }
    const previous = hero.troops[slot];
    hero.troops[slot] = { creatureId, count: Math.max(previous?.count ?? 1, 1) };
  }
</script>

<div class="table" role="group" aria-label={t('heroDialog.tab.troops')}>
  <span></span>
  <span class="head">{t('heroDialog.creature')}</span>
  <span class="head">{t('heroDialog.count')}</span>
  {#each hero.troops as troop, slot (slot)}
    <Combobox
      label={t('heroDialog.slot', { slot: slot + 1 })}
      inlineLabel
      {items}
      value={troop?.creatureId ?? EMPTY}
      onchange={(creatureId) => setCreature(slot, creatureId)}
    >
      {#snippet before()}
        <TownIcon group={creatureGroup(troop?.creatureId)} />
      {/snippet}
      {#snippet optionIcon(item)}
        <TownIcon group={creatureGroup(item.value)} />
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
