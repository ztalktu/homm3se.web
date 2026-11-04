<script lang="ts">
  import { session } from '../../../app/session.svelte';
  import { showToast } from '../../../app/toasts.svelte';
  import type { Hero } from '../../../core/hero';
  import { HERO_LIMITS, creatureProblem } from '../../../core/rules';
  import { CREATURES } from '../../../data/creatures';
  import { creatureDescription, creatureName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import Combobox from '../../components/Combobox.svelte';
  import NumberField from '../../components/NumberField.svelte';
  import type { ComboboxItem } from '../../components/combobox';

  interface Props {
    hero: Hero;
  }

  let { hero = $bindable() }: Props = $props();

  /** -1 stands for an empty slot in the list. */
  const EMPTY = -1;

  const items: ComboboxItem<number>[] = $derived([
    { value: EMPTY, label: t('heroDialog.noCreature') },
    ...CREATURES.map((creature) => ({
      value: creature.id,
      label: creatureName(creature.id),
      description: creatureDescription(creature),
      keywords: creature.town,
      disabled: creatureProblem(creature.id, session.edition) !== null,
    })),
  ]);

  /** The holes New World Computing left in the creature list get the old editor's joke. */
  function explainDisabled({ value }: ComboboxItem<number>): void {
    if (creatureProblem(value, session.edition) === 'placeholder') {
      showToast(t('joke.placeholderCreature'), { kind: 'warning' });
    }
  }

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
  <span class="head">{t('heroDialog.creature')}</span>
  <span class="head">{t('heroDialog.count')}</span>
  {#each hero.troops as troop, slot (slot)}
    <Combobox
      label={t('heroDialog.slot', { slot: slot + 1 })}
      {items}
      value={troop?.creatureId ?? EMPTY}
      onchange={(creatureId) => setCreature(slot, creatureId)}
      ondisabledpick={explainDisabled}
    />
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
    grid-template-columns: minmax(0, 2fr) minmax(120px, 1fr);
    gap: var(--space-2) var(--space-3);
    align-items: end;
  }

  .head {
    font-size: 13px;
    color: var(--color-label);
  }

  .empty {
    align-self: center;
    padding-top: var(--space-4);
    color: var(--color-text-muted);
  }
</style>
