<script lang="ts">
  /**
   * Spells as a grid: levels 1–5 down, the four schools across. Each spell shows its purpose,
   * a hint with its effect, and whether it was added or removed against the save. Spells missing
   * from the save's edition are hidden, unless the hero has one or had it in the file: it stays so
   * it can be removed.
   */
  import { session } from '../../../app/session.svelte';
  import type { Hero } from '../../../core/hero';
  import { isAvailableIn } from '../../../data/editions';
  import {
    SPELL_LEVELS,
    SPELL_PURPOSES,
    SPELLS,
    type Spell,
    type SpellLevel,
    type SpellPurpose,
  } from '../../../data/spells';
  import { spellEffect } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import { tooltip } from '../../actions/tooltip';
  import Button from '../../components/Button.svelte';
  import Checkbox from '../../components/Checkbox.svelte';
  import FilterRow from '../../components/FilterRow.svelte';
  import ChangeCount from '../shared/ChangeCount.svelte';
  import SpellGrid, { type SpellBoxState } from '../shared/SpellGrid.svelte';
  import SpellBookIcon from './SpellBookIcon.svelte';
  import SpellPurposeIcon from './SpellPurposeIcon.svelte';

  interface Props {
    hero: Hero;
    /** Spells as in the file when it was opened, to mark what the user added or removed. */
    opened: readonly number[];
  }

  let { hero = $bindable(), opened }: Props = $props();

  /** Purpose shown alone, or null for every spell. */
  let filter: SpellPurpose | null = $state(null);

  const openedSet = $derived(new Set(opened));
  const owned = $derived(new Set(hero.spells));
  const available = $derived(
    new Set(SPELLS.filter((s) => isAvailableIn(s.introducedIn, session.edition)).map((s) => s.id)),
  );
  const shown = $derived(
    SPELLS.filter(
      (s) =>
        (available.has(s.id) || owned.has(s.id) || openedSet.has(s.id)) &&
        (filter === null || s.purpose === filter),
    ),
  );
  /** With a filter on, a level with nothing to show is left out. */
  const levels = $derived(SPELL_LEVELS.filter((level) => shown.some((s) => s.level === level)));
  const added = $derived(hero.spells.filter((id) => !openedSet.has(id)).length);
  const removed = $derived(opened.filter((id) => !owned.has(id)).length);

  function learnedCount(spells: Spell[]): string {
    return `${spells.filter((s) => owned.has(s.id)).length} / ${spells.length}`;
  }

  /** Learns or forgets the given spells; one missing from the save's edition can only be forgotten. */
  function setSpells(spells: Spell[], learned: boolean): void {
    const changed = spells.filter((s) => !learned || available.has(s.id)).map((s) => s.id);
    const others = hero.spells.filter((id) => !changed.includes(id));
    hero.spells = (learned ? [...others, ...changed] : others).sort((a, b) => a - b);
  }

  function toggleLevel(level: SpellLevel): void {
    const spells = shown.filter((s) => s.level === level && available.has(s.id));
    setSpells(spells, !spells.every((s) => owned.has(s.id)));
  }

  /** Look of the check box: learned or not, and whether that changed since the file was opened. */
  function boxState({ id }: Spell): SpellBoxState {
    const wasOwned = openedSet.has(id);
    if (owned.has(id)) {
      return wasOwned ? 'on' : 'added';
    }
    return wasOwned ? 'removed' : 'off';
  }

  function hint(spell: Spell): string {
    if (!available.has(spell.id)) {
      return t('heroDialog.spellNotInEditionHint');
    }
    const school = t(`spellSchool.${spell.school}`);
    const level = t('heroDialog.spellLevelNamed', { level: spell.level });
    return `${school} · ${level} · ${t(`spellPurpose.${spell.purpose}`)}. ${spellEffect(spell.id)}`;
  }
</script>

<div class="spells">
  <div class="toolbar">
    <Checkbox
      label={t('heroDialog.spellBook')}
      hint={t('heroDialog.spellBookHint')}
      bind:checked={hero.hasSpellBook}
    >
      {#snippet icon()}<SpellBookIcon />{/snippet}
    </Checkbox>
    <div class="actions">
      <ChangeCount
        text={t('heroDialog.spellsLearned', { count: hero.spells.length, total: available.size })}
        {added}
        {removed}
      />
      <Button
        size="small"
        disabled={!hero.hasSpellBook || (added === 0 && removed === 0)}
        onclick={() => (hero.spells = [...opened])}
      >
        {t('editor.revert')}
      </Button>
      <Button size="small" disabled={!hero.hasSpellBook} onclick={() => setSpells(shown, true)}>
        {t('heroDialog.allSpells')}
      </Button>
      <Button size="small" disabled={!hero.hasSpellBook} onclick={() => setSpells(shown, false)}>
        {t('heroDialog.noSpells')}
      </Button>
    </div>
  </div>

  <FilterRow
    label={t('heroDialog.spellFilter')}
    options={SPELL_PURPOSES}
    bind:value={filter}
    columns={5}
  >
    {#snippet chip(purpose)}
      <SpellPurposeIcon {purpose} size={20} />
      {t(`spellPurpose.${purpose}`)}
    {/snippet}
  </FilterRow>

  <SpellGrid
    spells={shown}
    {levels}
    state={boxState}
    disabled={(spell) => !hero.hasSpellBook || (!available.has(spell.id) && !owned.has(spell.id))}
    {hint}
    onchange={(spell, checked) => setSpells([spell], checked)}
    schoolCount={learnedCount}
    key={{
      on: t('heroDialog.spellKeySaved'),
      off: t('heroDialog.spellKeyNone'),
      added: t('heroDialog.spellKeyAdded'),
      removed: t('heroDialog.spellKeyRemoved'),
    }}
  >
    {#snippet schoolTools(spells)}
      <button
        type="button"
        disabled={!hero.hasSpellBook}
        use:tooltip={t('heroDialog.schoolAllHint')}
        onclick={() => setSpells(spells, true)}
      >
        {t('heroDialog.schoolAll')}
      </button>
      <button
        type="button"
        disabled={!hero.hasSpellBook}
        use:tooltip={t('heroDialog.schoolNoneHint')}
        onclick={() => setSpells(spells, false)}
      >
        {t('heroDialog.schoolNone')}
      </button>
    {/snippet}
    {#snippet levelCell(level)}
      <button
        type="button"
        class="level"
        disabled={!hero.hasSpellBook}
        use:tooltip={t('heroDialog.spellLevelHint', { level })}
        onclick={() => toggleLevel(level)}
      >
        <span>{t('heroDialog.spellLevel')}<b>{level}</b></span>
      </button>
    {/snippet}
  </SpellGrid>
</div>

<style>
  .spells {
    display: grid;
    gap: var(--space-3);
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }
</style>
