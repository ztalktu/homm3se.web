<script lang="ts">
  /**
   * The town's buildings laid out like the town hall of the game: a block for each hall slot with
   * the levels it goes through. A click on a level builds it and everything below; the cross
   * demolishes the slot. When other blocks change with it (requirements built, buildings that
   * stood on it demolished), the editor asks first. The Grail, which the hall does not show, is a
   * button in the toolbar.
   */
  import { BUILDING, buildingKind, type FactionBuildings } from '../../../data/buildings';
  import type { Town as Faction } from '../../../data/creatures';
  import type { Town } from '../../../core/town';
  import {
    buildAll,
    minimumBuildings,
    restoreBuildings,
    sameBuildings,
    setBuilt,
    setSlotLevel,
    type BuildingChange,
  } from '../../../core/townBuildings';
  import { buildingDescription, buildingName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import { tooltip } from '../../actions/tooltip';
  import Button from '../../components/Button.svelte';
  import Dialog from '../../components/Dialog.svelte';
  import Icon from '../../components/Icon.svelte';
  import BuildingIcon from '../shared/BuildingIcon.svelte';

  interface Props {
    /** Built now, in the draft. */
    have: ReadonlySet<number>;
    /** Built in the file when the editor opened, to mark changed blocks. */
    opened: ReadonlySet<number>;
    town: Town;
    faction: Faction;
    buildings: FactionBuildings;
    /** Name of another town of the player with the Capitol, which blocks this one's. */
    capitolTown: string | undefined;
    /** Buildings that cannot go up here: the Capitol while another town has it. */
    locked: ReadonlySet<number>;
    onchange: (change: BuildingChange) => void;
  }

  let { have, opened, town, faction, buildings, capitolTown, locked, onchange }: Props = $props();

  /** A change that touches other blocks, waiting for the user's answer. */
  let pending: {
    change: BuildingChange;
    chain: readonly number[];
    target: number;
    adding: boolean;
  } | null = $state(null);
  let pendingOpen = $state(false);

  /** A map that allows nothing at all keeps no list: then no building is marked. */
  const mapKnown = $derived(town.allowed !== 0n);

  function banned(id: number): boolean {
    return mapKnown && (town.allowed & (1n << BigInt(id))) === 0n;
  }

  /** Index of the highest built level of a slot, -1 when none is. */
  function topLevel(chain: readonly number[], set: ReadonlySet<number>): number {
    let top = -1;
    chain.forEach((id, index) => {
      if (set.has(id)) {
        top = index;
      }
    });
    return top;
  }

  function title(chain: readonly number[]): string {
    const first = chain[0] ?? 0;
    const { kind, level } = buildingKind(first, town.faction, buildings);
    if (chain.length === 1) {
      return buildingName(faction, first);
    }
    switch (kind) {
      case 'townHall':
        return t('town.hall');
      case 'fort':
        return t('town.fort');
      case 'mageGuild':
        return t('town.guild');
      case 'market':
        return t('town.market');
      case 'dwelling':
        return t('town.dwellingLevel', { level: level ?? 1 });
      default:
        return buildingName(faction, first);
    }
  }

  function stateText(chain: readonly number[]): string {
    const top = topLevel(chain, have);
    if (top < 0) {
      return t('town.notBuilt');
    }
    if (chain.length === 1) {
      return t('town.built');
    }
    const first = chain[0] ?? 0;
    return first === BUILDING.mageGuild1
      ? t('town.guildLevel', { level: top + 1, max: chain.length })
      : buildingName(faction, chain[top] ?? first);
  }

  function blockChanged(chain: readonly number[]): boolean {
    return chain.some((id) => have.has(id) !== opened.has(id));
  }

  /** What a block name is in the dependency question. */
  function blockOf(id: number): string {
    const chain = buildings.hall.flat().find((slot) => slot.includes(id));
    return chain && chain.length > 1 ? t('buildings.inBlock', { block: title(chain) }) : '';
  }

  /** Applies a change at once, or asks when it reaches other blocks. */
  function propose(
    change: BuildingChange,
    chain: readonly number[],
    target: number,
    adding: boolean,
  ): void {
    const outside = [...change.added, ...change.removed].filter((id) => !chain.includes(id));
    if (outside.length === 0) {
      onchange(change);
      return;
    }
    pending = { change, chain, target, adding };
    pendingOpen = true;
  }

  function pick(chain: readonly number[], level: number): void {
    const target = chain[level] ?? 0;
    if (level === topLevel(chain, have) || locked.has(target)) {
      return;
    }
    propose(
      setSlotLevel(have, chain, level, buildings),
      chain,
      target,
      level > topLevel(chain, have),
    );
  }

  function demolish(chain: readonly number[]): void {
    propose(setSlotLevel(have, chain, -1, buildings), chain, chain[0] ?? 0, false);
  }

  /** Buildings of other blocks the pending change builds or demolishes, the main ones first. */
  function pendingLists(change: NonNullable<typeof pending>): { list: number[]; other: number[] } {
    const outside = (ids: number[]): number[] => ids.filter((id) => !change.chain.includes(id));
    const { added, removed } = change.change;
    return change.adding
      ? { list: outside(added), other: outside(removed) }
      : { list: outside(removed), other: outside(added) };
  }

  function confirm(): void {
    if (pending) {
      onchange(pending.change);
    }
    pending = null;
    pendingOpen = false;
  }

  const grailBuilt = $derived(have.has(BUILDING.grail));
  const grailName = $derived(buildingName(faction, BUILDING.grail));
  const opensSame = $derived(sameBuildings(have, opened));

  /** The slot with nothing but the Village Hall cannot be demolished. */
  function canDemolish(chain: readonly number[]): boolean {
    return chain.some((id) => have.has(id) && id !== BUILDING.villageHall);
  }

  /**
   * The second and third rows hold buildings with one or two levels (the marketplace, hordes,
   * a town's own buildings): their levels go in one line, like the guild's.
   */
  const INLINE_ROWS = [1, 2];

  /**
   * A level's name; one with the name of the level before it (a horde and its upgrade, both
   * called the same in the game) gets the mark of an upgrade.
   */
  function levelLabel(chain: readonly number[], index: number): string {
    const name = buildingName(faction, chain[index] ?? 0);
    const previous = index > 0 ? buildingName(faction, chain[index - 1] ?? 0) : undefined;
    return name === previous ? t('buildings.upgradedName', { name }) : name;
  }

  /**
   * Empty columns (of eight, two for a block) before a row of fewer than four slots: rows of three
   * sit half a block in, as in the game, and the Castle's two in the middle.
   */
  function padding(row: readonly (readonly number[])[]): number {
    return Math.max(0, 4 - row.length);
  }
</script>

<div class="toolbar">
  <Button
    size="small"
    variant="primary"
    onclick={() => onchange(buildAll(have, buildings, locked))}
  >
    {t('buildings.buildAll')}
  </Button>
  <Button
    size="small"
    hint={t('buildings.minimumHint')}
    onclick={() => onchange(minimumBuildings(have))}
  >
    {t('buildings.minimum')}
  </Button>
  <Button size="small" disabled={opensSame} onclick={() => onchange(restoreBuildings(have, opened))}
    >{t('editor.revert')}</Button
  >
  <span class="space"></span>
  <button
    type="button"
    class="grail"
    aria-pressed={grailBuilt}
    use:tooltip={t(grailBuilt ? 'buildings.grailHintBuilt' : 'buildings.grailHintNone', {
      name: grailName,
    })}
    onclick={() => onchange(setBuilt(have, BUILDING.grail, !grailBuilt, buildings))}
  >
    <BuildingIcon kind="grail" town={faction} />
    <span>{grailName}</span>
  </button>
</div>

<div class="hall-wrap">
  <div class="hall">
    {#each buildings.hall as row, rowIndex (rowIndex)}
      <div class="row">
        {#if padding(row) > 0}<span class="pad" style:--span={padding(row)}></span>{/if}
        {#each row as chain (chain.join())}
          {@const first = chain[0] ?? 0}
          {@const kind = buildingKind(first, town.faction, buildings)}
          {@const top = topLevel(chain, have)}
          {@const guild = first === BUILDING.mageGuild1}
          {@const inline = guild || INLINE_ROWS.includes(rowIndex)}
          <div class="block" class:changed={blockChanged(chain)}>
            <div class="head">
              <BuildingIcon kind={kind.kind} town={faction} level={kind.level} />
              <span class="title"><b>{title(chain)}</b>{stateText(chain)}</span>
              <button
                type="button"
                class="demolish"
                disabled={!canDemolish(chain)}
                aria-label={t('buildings.demolish', { name: title(chain) })}
                use:tooltip={t('buildings.demolish', { name: title(chain) })}
                onclick={() => demolish(chain)}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
            <div class="levels" class:inline>
              {#each chain as id, index (id)}
                {@const isLocked = locked.has(id) && !have.has(id)}
                {@const hint = isLocked
                  ? t('buildings.capitolElsewhere', { town: capitolTown ?? '' })
                  : `${buildingName(faction, id)}. ${buildingDescription(faction, id)}`}
                <button
                  type="button"
                  class="level"
                  class:chosen={index === top}
                  class:below={index < top}
                  class:short={guild}
                  class:in-row={inline && !guild}
                  class:locked={isLocked}
                  aria-disabled={isLocked}
                  aria-pressed={index <= top}
                  use:tooltip={hint}
                  onclick={() => pick(chain, index)}
                >
                  {#if isLocked}<Icon name="lock" size={12} />{/if}
                  <span class="label">{guild ? index + 1 : levelLabel(chain, index)}</span>
                  {#if banned(id) && !have.has(id)}
                    <span class="banned" use:tooltip={t('buildings.bannedHint')}>
                      <Icon name="warning" size={14} />
                    </span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>

<div class="key">
  <span><i class="swatch chosen"></i>{t('buildings.keyChosen')}</span>
  <span><i class="swatch below"></i>{t('buildings.keyBelow')}</span>
  <span><i class="swatch none"></i>{t('buildings.keyNone')}</span>
  <span><i class="swatch changed"></i>{t('buildings.keyChanged')}</span>
  <span><Icon name="warning" size={14} />{t('buildings.keyBanned')}</span>
  <span><Icon name="lock" size={14} />{t('buildings.keyLocked')}</span>
</div>

<Dialog
  bind:open={pendingOpen}
  title={t(pending?.adding ? 'buildings.addTitle' : 'buildings.removeTitle')}
  size="small"
  onclose={() => (pending = null)}
>
  {#if pending}
    {@const target = buildingName(faction, pending.target)}
    {@const { list, other } = pendingLists(pending)}
    <p>{t(pending.adding ? 'buildings.addText' : 'buildings.removeText', { name: target })}</p>
    <ul class="deps" class:adding={pending.adding}>
      {#each list as id (id)}
        <li>{buildingName(faction, id)} <span class="block-name">{blockOf(id)}</span></li>
      {/each}
    </ul>
    {#if other.length > 0}
      <ul class="deps" class:adding={!pending.adding}>
        {#each other as id (id)}
          <li>{buildingName(faction, id)} <span class="block-name">{blockOf(id)}</span></li>
        {/each}
      </ul>
    {/if}
  {/if}
  {#snippet footer()}
    <Button onclick={() => (pendingOpen = false)}>{t('common.cancel')}</Button>
    <Button variant="primary" onclick={confirm}>
      {t(pending?.adding ? 'buildings.addConfirm' : 'buildings.removeConfirm')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .space {
    flex: 1;
  }

  .grail {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 30px;
    padding: 2px var(--space-3) 2px var(--space-2);
    border: 1px dashed var(--color-frame-soft);
    border-radius: var(--radius-small);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 13px;
    cursor: pointer;
  }

  .grail[aria-pressed='false'] :global(.badge) {
    filter: grayscale(1);
    opacity: 0.6;
  }

  .grail[aria-pressed='true'] {
    border: 1px solid var(--color-primary);
    background: var(--color-primary);
    color: var(--color-primary-text);
  }

  .hall-wrap {
    container-type: inline-size;
  }

  .hall {
    display: grid;
    gap: var(--space-2);
  }

  /* Eight columns: a block takes two, so rows of four and of three (half a block in) line up. */
  .row {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: var(--space-2) var(--space-3);
  }

  .pad {
    grid-column: span var(--span);
  }

  /* Rows as in the game while a block keeps about 150px; narrower, two blocks a row. */
  @container (max-width: 640px) {
    .row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .pad {
      display: none;
    }

    .row .block {
      grid-column: auto;
    }
  }

  @container (max-width: 380px) {
    .row {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .block {
    grid-column: span 2;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px var(--space-2);
    border: 1px solid var(--color-frame-soft);
    border-radius: var(--radius);
  }

  .block.changed {
    border-color: var(--color-unsaved);
    box-shadow: inset 3px 0 0 var(--color-unsaved);
  }

  .head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 28px;
  }

  .title {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    line-height: 1.2;
    color: var(--color-label);
  }

  .title b {
    display: block;
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text);
  }

  .demolish {
    flex: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 1px solid var(--color-secondary-border);
    border-radius: var(--radius-small);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
  }

  .demolish:hover:not(:disabled) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-danger-text);
  }

  .demolish:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .levels {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  /* One line when the names fit; otherwise a level moves down whole, never breaking its name. */
  .levels.inline {
    flex-flow: row wrap;
  }

  .level {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 26px;
    padding: 2px var(--space-2);
    border: 1px dashed var(--color-frame-soft);
    border-radius: var(--radius-small);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 13px;
    line-height: 1.2;
    text-align: left;
    cursor: pointer;
  }

  /* Levels in one line share the width by their names: a short name takes less. */
  .level.in-row {
    flex: 1 1 auto;
  }

  .level.in-row .label {
    white-space: nowrap;
  }

  .level.short {
    flex: 1 1 0;
    justify-content: center;
    padding: 3px 0;
  }

  .level:hover:not(.locked) {
    border-style: solid;
    border-color: var(--color-frame);
    color: var(--color-text);
  }

  .level.below {
    border: 1px solid var(--color-frame-soft);
    background: var(--color-unsaved-soft);
    color: var(--color-text);
  }

  .level.chosen {
    border: 1px solid var(--color-primary);
    background: var(--color-primary);
    color: var(--color-primary-text);
  }

  /* Not disabled, so the hint with the reason still shows; a click does nothing. */
  .level.locked {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .label {
    flex: 1;
    min-width: 0;
  }

  .level.short .label {
    flex: none;
  }

  .banned {
    display: inline-flex;
    color: var(--color-unsaved);
  }

  .level.chosen .banned {
    color: inherit;
  }

  .key {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    margin-top: var(--space-3);
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .key span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .swatch {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 3px;
  }

  .swatch.chosen {
    background: var(--color-primary);
  }

  .swatch.below {
    border: 1px solid var(--color-frame-soft);
    background: var(--color-unsaved-soft);
  }

  .swatch.none {
    border: 1px dashed var(--color-frame-soft);
  }

  .swatch.changed {
    border: 1px solid var(--color-unsaved);
    box-shadow: inset 3px 0 0 var(--color-unsaved);
  }

  p {
    margin: 0;
  }

  .deps {
    margin: var(--space-2) 0 0;
    padding-left: var(--space-5);
    color: var(--color-removed-text);
  }

  .deps.adding {
    color: var(--color-added-text);
  }

  .block-name {
    font-size: 13px;
    color: var(--color-text-muted);
  }
</style>
