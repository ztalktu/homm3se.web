<script lang="ts">
  /**
   * Spells as a grid: levels 1–5 down, the four schools across. Each spell shows its purpose,
   * a hint with its effect, and whether it was added or removed against the save.
   */
  import { session } from '../../../app/session.svelte';
  import type { Hero } from '../../../core/hero';
  import { isAvailableIn } from '../../../data/editions';
  import {
    SPELL_LEVELS,
    SPELL_PURPOSES,
    SPELL_SCHOOLS,
    SPELLS,
    isInSchool,
    type MagicSchool,
    type Spell,
    type SpellLevel,
    type SpellPurpose,
  } from '../../../data/spells';
  import { spellEffect, spellName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import { tooltip } from '../../actions/tooltip';
  import Button from '../../components/Button.svelte';
  import Checkbox from '../../components/Checkbox.svelte';
  import AllSchoolsBadge from './AllSchoolsBadge.svelte';
  import SchoolScene from './SchoolScene.svelte';
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
  const shown = $derived(SPELLS.filter((s) => filter === null || s.purpose === filter));
  /** With a filter on, a level with nothing to show is left out. */
  const levels = $derived(SPELL_LEVELS.filter((level) => shown.some((s) => s.level === level)));
  const added = $derived(hero.spells.filter((id) => !openedSet.has(id)).length);
  const removed = $derived(opened.filter((id) => !owned.has(id)).length);

  function cell(level: SpellLevel, school: MagicSchool): Spell[] {
    const order = (spell: Spell): number => SPELL_PURPOSES.indexOf(spell.purpose);
    return shown
      .filter((s) => s.level === level && isInSchool(s, school))
      .sort(
        (a, b) =>
          Number(b.school === 'all') - Number(a.school === 'all') ||
          order(a) - order(b) ||
          spellName(a.id).localeCompare(spellName(b.id)),
      );
  }

  function schoolSpells(school: MagicSchool): Spell[] {
    return shown.filter((s) => isInSchool(s, school));
  }

  function learnedCount(spells: Spell[]): string {
    return `${spells.filter((s) => owned.has(s.id)).length} / ${spells.length}`;
  }

  /** Learns or forgets the given spells; spells missing from the save's edition stay as they are. */
  function setSpells(spells: Spell[], learned: boolean): void {
    const changed = spells.filter((s) => available.has(s.id)).map((s) => s.id);
    const others = hero.spells.filter((id) => !changed.includes(id));
    hero.spells = (learned ? [...others, ...changed] : others).sort((a, b) => a - b);
  }

  function toggleLevel(level: SpellLevel): void {
    const spells = shown.filter((s) => s.level === level && available.has(s.id));
    setSpells(spells, !spells.every((s) => owned.has(s.id)));
  }

  /** Look of the check box: learned or not, and whether that changed since the file was opened. */
  function boxState(id: number): 'on' | 'off' | 'added' | 'removed' {
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
      <span class="count">
        {t('heroDialog.spellsLearned', { count: hero.spells.length, total: available.size })}
        {#if added > 0}· <span class="added">+{added}</span>{/if}
        {#if removed > 0}· <span class="removed">−{removed}</span>{/if}
      </span>
      <Button
        size="small"
        disabled={!hero.hasSpellBook || (added === 0 && removed === 0)}
        onclick={() => (hero.spells = [...opened])}
      >
        {t('heroDialog.revertSpells')}
      </Button>
      <Button size="small" disabled={!hero.hasSpellBook} onclick={() => setSpells(shown, true)}>
        {t('heroDialog.allSpells')}
      </Button>
      <Button size="small" disabled={!hero.hasSpellBook} onclick={() => setSpells(shown, false)}>
        {t('heroDialog.noSpells')}
      </Button>
    </div>
  </div>

  <!-- Click shows only this purpose, clicking it again shows everything, another one switches. -->
  <div class="filter" role="group" aria-label={t('heroDialog.spellFilter')}>
    {#each SPELL_PURPOSES as purpose (purpose)}
      <button
        type="button"
        class="purpose"
        aria-pressed={filter === purpose}
        class:dim={filter !== null && filter !== purpose}
        onclick={() => (filter = filter === purpose ? null : purpose)}
      >
        <SpellPurposeIcon {purpose} size={20} />
        {t(`spellPurpose.${purpose}`)}
      </button>
    {/each}
  </div>

  <!-- Horizontal scroll only: overflow-x alone turns overflow-y to auto, and a 1px rounding
       gap then shows a vertical bar. -->
  <div class="grid-scroll">
    <div class="grid">
      <div class="corner">{t('heroDialog.spellLevel')}</div>
      {#each SPELL_SCHOOLS as school (school)}
        <div class="school">
          <SchoolScene {school} />
          <div class="school-tools">
            <button
              type="button"
              disabled={!hero.hasSpellBook}
              use:tooltip={t('heroDialog.schoolAllHint')}
              onclick={() => setSpells(schoolSpells(school), true)}
            >
              {t('heroDialog.schoolAll')}
            </button>
            <button
              type="button"
              disabled={!hero.hasSpellBook}
              use:tooltip={t('heroDialog.schoolNoneHint')}
              onclick={() => setSpells(schoolSpells(school), false)}
            >
              {t('heroDialog.schoolNone')}
            </button>
          </div>
          <div class="school-bar">
            {t(`spellSchool.${school}`)}
            <span class="school-count">{learnedCount(schoolSpells(school))}</span>
          </div>
        </div>
      {/each}

      {#each levels as level (level)}
        <button
          type="button"
          class="level"
          disabled={!hero.hasSpellBook}
          use:tooltip={t('heroDialog.spellLevelHint', { level })}
          onclick={() => toggleLevel(level)}
        >
          <span>{t('heroDialog.spellLevel')}<b>{level}</b></span>
        </button>
        {#each SPELL_SCHOOLS as school (school)}
          <div class="cell">
            {#each cell(level, school) as spell (spell.id)}
              {@const disabled = !hero.hasSpellBook || !available.has(spell.id)}
              <label class="spell" class:disabled use:tooltip={hint(spell)}>
                <input
                  type="checkbox"
                  checked={owned.has(spell.id)}
                  {disabled}
                  onchange={(event) => setSpells([spell], event.currentTarget.checked)}
                />
                <span class="box" data-state={boxState(spell.id)} aria-hidden="true"></span>
                <SpellPurposeIcon purpose={spell.purpose} size={20} />
                <span class="name">{spellName(spell.id)}</span>
                {#if spell.school === 'all'}<AllSchoolsBadge label={t('spellSchool.all')} />{/if}
              </label>
            {/each}
          </div>
        {/each}
      {/each}
    </div>
  </div>

  <div class="key">
    <span><i class="box" data-state="on"></i>{t('heroDialog.spellKeySaved')}</span>
    <span><i class="box" data-state="off"></i>{t('heroDialog.spellKeyNone')}</span>
    <span><i class="box" data-state="added"></i>{t('heroDialog.spellKeyAdded')}</span>
    <span><i class="box" data-state="removed"></i>{t('heroDialog.spellKeyRemoved')}</span>
  </div>
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

  .count {
    color: var(--color-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .count .added {
    color: var(--color-spell-added);
    font-weight: 600;
  }

  .count .removed {
    color: var(--color-spell-removed);
    font-weight: 600;
  }

  /* Five equal columns sized by the widest label, centred as a block. */
  .filter {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    width: max-content;
    max-width: 100%;
    margin-inline: auto;
    gap: var(--space-1) var(--space-2);
  }

  .purpose {
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

  .purpose:hover {
    background: var(--color-secondary-hover);
    border-color: var(--color-frame);
  }

  .purpose[aria-pressed='true'] {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-primary-text);
  }

  .purpose.dim {
    opacity: 0.5;
  }

  .grid-scroll {
    overflow-x: auto;
    overflow-y: hidden;
  }

  .grid {
    display: grid;
    grid-template-columns: 52px repeat(4, minmax(170px, 1fr));
    min-width: 760px;
    gap: var(--space-2);
  }

  .corner {
    display: grid;
    place-items: end center;
    padding-bottom: 6px;
    color: var(--color-text-muted);
    font: 500 13px var(--font-heading);
  }

  .school {
    position: relative;
    height: 64px;
    overflow: hidden;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-small);
  }

  .school-bar {
    position: absolute;
    inset: auto 0 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 14px var(--space-2) 5px;
    background: linear-gradient(transparent, var(--color-scene-shade));
    color: var(--color-header-text);
    font: 500 15px var(--font-heading);
  }

  .school-count {
    margin-left: auto;
    color: var(--color-header-label);
    font: 13px var(--font-body);
    font-variant-numeric: tabular-nums;
  }

  .school-tools {
    position: absolute;
    top: 5px;
    right: 5px;
    display: flex;
    gap: 4px;
  }

  .school-tools button {
    padding: 3px 8px;
    border: 1px solid var(--color-header-control-border);
    border-radius: var(--radius-small);
    background: var(--color-header-control);
    color: var(--color-header-text);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
  }

  .school-tools button:hover:not(:disabled) {
    background: var(--color-header-control-hover);
    border-color: var(--color-frame);
  }

  .level {
    display: grid;
    place-items: center;
    width: 100%;
    padding: 0;
    border: 1px solid var(--color-frame-soft);
    border-radius: var(--radius-small);
    background: var(--color-header);
    color: var(--color-header-label);
    font: 500 13px var(--font-heading);
    cursor: pointer;
  }

  .level b {
    display: block;
    color: var(--color-header-text);
    font-size: 22px;
    font-weight: 500;
    line-height: 1.1;
  }

  .level:hover:not(:disabled) {
    border-color: var(--color-frame);
  }

  .level:disabled,
  .school-tools button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .cell {
    display: grid;
    align-content: start;
    gap: 0;
    min-height: 32px;
    padding: var(--space-1);
    border: 1px solid var(--color-field-border);
    border-radius: var(--radius-small);
    background: var(--color-field);
    color: var(--color-field-text);
  }

  .spell {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 24px;
    padding: 1px var(--space-1);
    border-radius: var(--radius-small);
    font-size: 13px;
    line-height: 1.2;
    cursor: pointer;
    user-select: none;
  }

  .spell:hover:not(.disabled) {
    background: var(--color-option-hover);
  }

  .spell.disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .spell input {
    position: absolute;
    opacity: 0;
    width: 18px;
    height: 18px;
    margin: 0;
  }

  .name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  /* Same box as Checkbox.svelte; data-state adds the marks for changes since the file was opened. */
  .box {
    flex: none;
    position: relative;
    width: 18px;
    height: 18px;
    border: 1px solid var(--color-field-border);
    border-radius: 4px;
    background: var(--color-field);
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast);
  }

  .spell:hover:not(.disabled) .box[data-state='off'] {
    border-color: var(--color-frame);
  }

  .box[data-state='on'] {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }

  .box[data-state='added'] {
    background: var(--color-spell-added);
    border-color: var(--color-spell-added);
  }

  .box[data-state='removed'] {
    border: 2px solid var(--color-spell-removed);
    box-shadow: 0 0 0 2px var(--color-spell-removed-soft);
  }

  /* Check mark */
  .box[data-state='on']::after,
  .box[data-state='added']::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 1px;
    width: 5px;
    height: 10px;
    border-right: 2px solid var(--color-primary-text);
    border-bottom: 2px solid var(--color-primary-text);
    transform: rotate(45deg);
  }

  .box[data-state='added']::after {
    border-color: var(--color-spell-on-color);
  }

  .spell input:focus-visible ~ .box {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .key {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    color: var(--color-text-muted);
    font-size: 13px;
  }

  .key span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  @media (max-width: 640px) {
    .filter {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
