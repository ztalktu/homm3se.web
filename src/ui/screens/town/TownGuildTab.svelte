<script lang="ts">
  /**
   * The mage guild in the grid of the hero's spells: levels down, schools across. A check box puts
   * a spell into its level; any spell of the level fits, whatever the faction. A full level takes
   * no more until one is taken off; a level not built shows its spells greyed.
   */
  import { session } from '../../../app/session.svelte';
  import { fillGuild } from '../../../core/townBuildings';
  import { isAvailableIn } from '../../../data/editions';
  import {
    GUILD_SPELL_CHANCES,
    SPELL_LEVELS,
    SPELLS,
    type Spell,
    type SpellLevel,
  } from '../../../data/spells';
  import { spellEffect } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import Button from '../../components/Button.svelte';
  import ChangeCount from '../shared/ChangeCount.svelte';
  import SpellGrid, { type SpellBoxState } from '../shared/SpellGrid.svelte';

  interface Props {
    /** Spells in the slots of each level, the draft. */
    chosen: number[][];
    /** As in the file when the editor opened. */
    openedGuild: readonly (readonly number[])[];
    /** Slots of each level; 0 for a level not built. */
    capacities: readonly number[];
    factionIndex: number;
    guildMax: number;
  }

  let { chosen = $bindable(), openedGuild, capacities, factionIndex, guildMax }: Props = $props();

  /** No guild of any faction ever holds a spell with no chance anywhere (Titan's Lightning Bolt). */
  const shown = $derived(
    SPELLS.filter(
      (spell) =>
        spell.level <= guildMax &&
        isAvailableIn(spell.introducedIn, session.edition) &&
        GUILD_SPELL_CHANCES.some((chances) => (chances[spell.id] ?? 0) > 0),
    ),
  );
  const levels = $derived(SPELL_LEVELS.filter((level) => level <= guildMax));

  const inLevel = (spell: Spell, rows: readonly (readonly number[])[]): boolean =>
    (rows[spell.level - 1] ?? []).includes(spell.id);

  function boxState(spell: Spell): SpellBoxState {
    const now = inLevel(spell, chosen) && (capacities[spell.level - 1] ?? 0) > 0;
    const was = inLevel(spell, openedGuild);
    if (now) {
      return was ? 'on' : 'added';
    }
    return was ? 'removed' : 'off';
  }

  function full(level: number): boolean {
    return (chosen[level - 1]?.length ?? 0) >= (capacities[level - 1] ?? 0);
  }

  function disabled(spell: Spell): boolean {
    return (
      (capacities[spell.level - 1] ?? 0) === 0 || (full(spell.level) && !inLevel(spell, chosen))
    );
  }

  function hint(spell: Spell): string {
    if ((capacities[spell.level - 1] ?? 0) > 0 && disabled(spell)) {
      return t('guild.full');
    }
    return `${t(`spellSchool.${spell.school}`)} · ${t('heroDialog.spellLevelNamed', {
      level: spell.level,
    })}. ${spellEffect(spell.id)}`;
  }

  function toggle(spell: Spell, checked: boolean): void {
    const index = spell.level - 1;
    const row = chosen[index] ?? [];
    chosen[index] = checked ? [...row, spell.id] : row.filter((id) => id !== spell.id);
  }

  function schoolCount(spells: Spell[]): string {
    return String(
      spells.filter((spell) => inLevel(spell, chosen) && (capacities[spell.level - 1] ?? 0) > 0)
        .length,
    );
  }

  function shuffle(): void {
    chosen = fillGuild(
      chosen.map((row, level) => ((capacities[level] ?? 0) > 0 ? [] : row)),
      capacities,
      factionIndex,
    );
  }

  const builtLevels = $derived(capacities.filter((slots) => slots > 0).length);
  const states = $derived(shown.map(boxState));
  const added = $derived(states.filter((state) => state === 'added').length);
  const removed = $derived(states.filter((state) => state === 'removed').length);
  const unchanged = $derived(JSON.stringify(chosen) === JSON.stringify(openedGuild));

  function levelCount(level: SpellLevel): string {
    const slots = capacities[level - 1] ?? 0;
    return slots === 0
      ? t('guild.levelNotBuilt')
      : t('guild.levelCount', { count: chosen[level - 1]?.length ?? 0, slots });
  }
</script>

<div class="guild">
  <div class="toolbar">
    <ChangeCount
      text={t('guild.levelsBuilt', { built: builtLevels, max: guildMax })}
      {added}
      {removed}
    />
    <div class="actions">
      <Button
        size="small"
        disabled={unchanged}
        onclick={() => (chosen = openedGuild.map((row) => [...row]))}
      >
        {t('editor.revert')}
      </Button>
      <Button
        size="small"
        disabled={builtLevels === 0}
        hint={t('guild.shuffleHint')}
        onclick={shuffle}
      >
        {t('guild.shuffle')}
      </Button>
    </div>
  </div>

  <SpellGrid
    spells={shown}
    {levels}
    state={boxState}
    {disabled}
    {hint}
    onchange={toggle}
    {schoolCount}
    key={{
      on: t('guild.keyOn'),
      off: t('guild.keyOff'),
      added: t('heroDialog.spellKeyAdded'),
      removed: t('heroDialog.spellKeyRemoved'),
    }}
  >
    {#snippet levelCell(level)}
      <div class="level" class:off={(capacities[level - 1] ?? 0) === 0}>
        <span>{t('heroDialog.spellLevel')}<b>{level}</b></span>
        <small>{levelCount(level)}</small>
      </div>
    {/snippet}
  </SpellGrid>

  <p class="note">{t('guild.note')}</p>
</div>

<style>
  .guild {
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
    gap: var(--space-2);
  }

  .level {
    text-align: center;
  }

  .level small {
    display: block;
    font: 12px var(--font-body);
  }

  .level.off {
    opacity: 0.55;
  }

  .note {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted);
  }
</style>
