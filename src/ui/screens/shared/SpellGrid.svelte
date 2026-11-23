<script module lang="ts">
  /** Checked or not, and whether that changed since the file was opened. */
  export type SpellBoxState = 'on' | 'off' | 'added' | 'removed';
</script>

<script lang="ts">
  /**
   * Spells as a grid: levels down, the four schools across, each school under its painted header.
   * Each spell has a check box whose look tells whether it was added or removed against the
   * save, its purpose and a hint. The caller decides what is checked and what a click does: a
   * hero's spell book, a town's mage guild.
   */
  import type { Snippet } from 'svelte';
  import {
    SPELL_PURPOSES,
    SPELL_SCHOOLS,
    isInSchool,
    type MagicSchool,
    type Spell,
    type SpellLevel,
  } from '../../../data/spells';
  import { spellName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import { tooltip } from '../../actions/tooltip';
  import AllSchoolsBadge from '../hero/AllSchoolsBadge.svelte';
  import SchoolScene from '../hero/SchoolScene.svelte';
  import SpellPurposeIcon from '../hero/SpellPurposeIcon.svelte';

  interface Props {
    /** The spells to show. */
    spells: readonly Spell[];
    levels: readonly SpellLevel[];
    state: (spell: Spell) => SpellBoxState;
    disabled: (spell: Spell) => boolean;
    hint: (spell: Spell) => string;
    onchange: (spell: Spell, checked: boolean) => void;
    /** Shown on the right of a school's header, such as "3 / 12". */
    schoolCount: (spells: Spell[]) => string;
    /** Buttons in the top corner of a school's header. */
    schoolTools?: Snippet<[Spell[]]> | undefined;
    /** The first cell of a level's row; give the element the `level` class. */
    levelCell: Snippet<[SpellLevel]>;
    /** Texts of the legend, by box look. */
    key: Record<SpellBoxState, string>;
  }

  let {
    spells,
    levels,
    state,
    disabled,
    hint,
    onchange,
    schoolCount,
    schoolTools,
    levelCell,
    key,
  }: Props = $props();

  function cell(level: SpellLevel, school: MagicSchool): Spell[] {
    const order = (spell: Spell): number => SPELL_PURPOSES.indexOf(spell.purpose);
    return spells
      .filter((s) => s.level === level && isInSchool(s, school))
      .sort(
        (a, b) =>
          Number(b.school === 'all') - Number(a.school === 'all') ||
          order(a) - order(b) ||
          spellName(a.id).localeCompare(spellName(b.id)),
      );
  }

  function schoolSpells(school: MagicSchool): Spell[] {
    return spells.filter((s) => isInSchool(s, school));
  }

  const KEY_ORDER: readonly SpellBoxState[] = ['on', 'off', 'added', 'removed'];
</script>

<!-- Horizontal scroll only: overflow-x alone turns overflow-y to auto, and a 1px rounding
     gap then shows a vertical bar. -->
<div class="grid-scroll">
  <div class="grid">
    <div class="corner">{t('heroDialog.spellLevel')}</div>
    {#each SPELL_SCHOOLS as school (school)}
      <div class="school">
        <SchoolScene {school} />
        {#if schoolTools}
          <div class="school-tools">
            {@render schoolTools(schoolSpells(school))}
          </div>
        {/if}
        <div class="school-bar">
          {t(`spellSchool.${school}`)}
          <span class="school-count">{schoolCount(schoolSpells(school))}</span>
        </div>
      </div>
    {/each}

    {#each levels as level (level)}
      {@render levelCell(level)}
      {#each SPELL_SCHOOLS as school (school)}
        <div class="cell">
          {#each cell(level, school) as spell (spell.id)}
            {@const off = disabled(spell)}
            {@const look = state(spell)}
            <label class="spell" class:disabled={off} use:tooltip={hint(spell)}>
              <input
                type="checkbox"
                checked={look === 'on' || look === 'added'}
                disabled={off}
                onchange={(event) => onchange(spell, event.currentTarget.checked)}
              />
              <span class="box" data-state={look} aria-hidden="true"></span>
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
  {#each KEY_ORDER as look (look)}
    <span><i class="box" data-state={look}></i>{key[look]}</span>
  {/each}
</div>

<style>
  /* Five equal columns sized by the widest label, centred as a block. */
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

  .school-tools :global(button) {
    padding: 3px 8px;
    border: 1px solid var(--color-header-control-border);
    border-radius: var(--radius-small);
    background: var(--color-header-control);
    color: var(--color-header-text);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
  }

  .school-tools :global(button:hover:not(:disabled)) {
    background: var(--color-header-control-hover);
    border-color: var(--color-frame);
  }

  .grid :global(.level) {
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

  .grid :global(.level b) {
    display: block;
    color: var(--color-header-text);
    font-size: 22px;
    font-weight: 500;
    line-height: 1.1;
  }

  .grid :global(button.level:hover:not(:disabled)) {
    border-color: var(--color-frame);
  }

  .grid :global(.level:disabled),
  .school-tools :global(button:disabled) {
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

  /* A level cell that only shows something (a mage guild level) is not clickable. */
  .grid :global(div.level) {
    cursor: default;
  }
</style>
