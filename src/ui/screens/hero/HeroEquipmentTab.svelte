<script lang="ts">
  /**
   * What the hero wears: the slots stand where the game's hero screen has them, around a drawn
   * figure. A click picks a slot; the card next to it shows what is worn there and changes it.
   * War machines and the spell book are switched on and off right on the figure.
   */
  import { preferences, setMoveToBackpack } from '../../../app/preferences.svelte';
  import { session } from '../../../app/session.svelte';
  import {
    equipmentLocks,
    fitsSlot,
    takeOffArtifact,
    warMachines,
    wearArtifact,
    type EquipmentEdit,
  } from '../../../core/equipment';
  import type { Hero } from '../../../core/hero';
  import { COMMON_HERO_FIELDS } from '../../../core/layouts';
  import { artifactsOf } from '../../../data/artifacts';
  import {
    combinationLocks,
    WAR_MACHINE_SLOTS,
    WORN_SLOTS,
    type EquipmentSlotKey,
  } from '../../../data/equipment';
  import { artifactDescription, artifactName } from '../../../i18n/game.svelte';
  import { equipmentSlotName, t } from '../../../i18n/index.svelte';
  import { tooltip } from '../../actions/tooltip';
  import Button from '../../components/Button.svelte';
  import Checkbox from '../../components/Checkbox.svelte';
  import Combobox from '../../components/Combobox.svelte';
  import Dialog from '../../components/Dialog.svelte';
  import Icon from '../../components/Icon.svelte';
  import type { ComboboxItem } from '../../components/combobox';
  import { placeTakenOff, type TakenOff } from '../../logic/takenOff';
  import ArtifactIcon from './ArtifactIcon.svelte';
  import SpellBookIcon from './SpellBookIcon.svelte';
  import WarMachineIcon from './WarMachineIcon.svelte';

  interface Props {
    hero: Hero;
    /** Worn artifacts as in the file when it was opened: changed slots get a mark. */
    opened: readonly (number | null)[];
    /** Whether the hero had the spell book when the file was opened. */
    openedSpellBook: boolean;
  }

  let { hero = $bindable(), opened, openedSpellBook }: Props = $props();

  /** Top left corner of each slot in a 1128 × 1360 picture with 175 px slots. */
  const PLACES: Record<EquipmentSlotKey, [number, number]> = {
    head: [507, 22],
    ballista: [727, 22],
    ammoCart: [910, 22],
    firstAidTent: [910, 205],
    catapult: [910, 390],
    rightHand: [3, 178],
    ring1: [195, 178],
    neck: [507, 220],
    torso: [507, 425],
    misc1: [3, 470],
    misc2: [68, 672],
    misc3: [130, 877],
    misc4: [195, 1080],
    misc5: [3, 1080],
    leftHand: [720, 635],
    ring2: [910, 635],
    shoulders: [742, 868],
    feet: [530, 1080],
    spellBook: [910, 1145],
  };
  const place = (key: EquipmentSlotKey): string => {
    const [x, y] = PLACES[key];
    return `left: ${(x / 1128) * 100}%; top: ${(y / 1360) * 100}%`;
  };

  /** The worn-artifact slots the save has (no fifth misc slot before The Shadow of Death). */
  const wornSlots = $derived(WORN_SLOTS.filter((slot) => slot.index < hero.equipment.length));

  let selected = $state(3);
  let search = $state('');
  let pick: number | null = $state(null);

  const edition = $derived(session.edition);
  const locks = $derived(equipmentLocks(hero.equipment, edition));
  const max = COMMON_HERO_FIELDS.backpackSlots;

  const name = (artifactId: number): string => artifactName(artifactId, edition);
  const names = (artifactIds: readonly number[]): string => artifactIds.map(name).join(', ');
  /** Name of the combination artifact in slot `owner`, which takes another slot. */
  const ownerName = (owner: number): string => {
    const artifactId = hero.equipment[owner] ?? null;
    return artifactId === null ? '' : name(artifactId);
  };

  function slotState(index: number): string {
    const owner = locks.get(index);
    const artifactId = hero.equipment[index] ?? null;
    if (owner !== undefined) {
      return t('heroDialog.slotTaken', { name: ownerName(owner) });
    }
    return artifactId === null ? t('hero.emptySlot') : name(artifactId);
  }

  const changed = (index: number): boolean =>
    (hero.equipment[index] ?? null) !== (opened[index] ?? null);

  const items: ComboboxItem<number>[] = $derived(
    artifactsOf(edition)
      .filter((artifact) => !artifact.unused && fitsSlot(artifact.id, selected, edition))
      .map((artifact) => ({
        value: artifact.id,
        label: artifactName(artifact.id, edition),
        description: [
          combinationLocks(artifact.id, edition) ? t('heroDialog.combination') : '',
          artifactDescription(artifact.id, edition) ?? '',
        ]
          .filter(Boolean)
          .join(' · '),
        highlighted: hero.equipment[selected] === artifact.id,
      })),
  );

  // ---------- questions ----------

  interface Question {
    title: string;
    lines: { text: string; tone?: 'muted' | 'danger' }[];
    list?: string[];
    okLabel: string;
    danger: boolean;
    onok: () => void;
  }
  let question: Question | null = $state(null);
  let questionOpen = $state(false);

  function ask(next: Question): void {
    question = next;
    questionOpen = true;
  }

  function answer(): void {
    const onok = question?.onok;
    questionOpen = false;
    onok?.();
  }

  /** What happens to the artifacts that come off, as lines of a question. */
  function fateLines(
    placed: TakenOff,
    deletedKey: 'willBeDeleted' | 'deletedForever',
  ): Question['lines'] {
    return [
      ...(placed.toBackpack.length > 0
        ? [
            {
              text: t('heroDialog.goesToBackpack', { names: names(placed.toBackpack) }),
              tone: 'muted' as const,
            },
          ]
        : []),
      ...(placed.deleted.length > 0
        ? [
            {
              text: t(`heroDialog.${deletedKey}`, { names: names(placed.deleted) }),
              tone: 'danger' as const,
            },
          ]
        : []),
    ];
  }

  /**
   * Applies an edit: what came off goes into the backpack when the box is ticked, or is
   * deleted. A backpack without room for all of it asks first.
   */
  function apply(edit: EquipmentEdit): void {
    const placed = placeTakenOff(
      edit.removed,
      preferences.moveToBackpack,
      edition,
      max - hero.backpack.length,
    );
    const commit = (): void => {
      hero.equipment = edit.equipment;
      hero.backpack.push(...placed.toBackpack);
    };
    if (!placed.overflow) {
      commit();
      return;
    }
    ask({
      title: t('heroDialog.backpackFullTitle'),
      lines: [
        {
          text: t('heroDialog.backpackFullText', {
            free: max - hero.backpack.length,
            count: edit.removed.length,
          }),
        },
        ...fateLines(placed, 'deletedForever'),
      ],
      okLabel: t('heroDialog.deleteForever'),
      danger: true,
      onok: commit,
    });
  }

  function wear(artifactId: number): void {
    const edit = wearArtifact(hero.equipment, selected, artifactId, edition);
    // Asks only when a combination artifact pushes something out of other slots.
    if (edit.displaced.length === 0) {
      apply(edit);
      return;
    }
    const slot = selected;
    const taken = [...equipmentLocks(edit.equipment, edition)]
      .filter(([, owner]) => owner === slot)
      .map(([index]) => index)
      .sort((a, b) => a - b);
    ask({
      title: name(artifactId),
      lines: fateLines(
        placeTakenOff(edit.removed, preferences.moveToBackpack, edition),
        'willBeDeleted',
      ),
      list: taken.map(equipmentSlotName),
      okLabel: t('heroDialog.confirm'),
      danger: false,
      onok: () => apply(edit),
    });
  }

  function onPick(item: ComboboxItem<number>): void {
    pick = null;
    search = '';
    if (item.value !== hero.equipment[selected]) {
      wear(item.value);
    }
  }

  function takeOff(): void {
    apply(takeOffArtifact(hero.equipment, selected));
  }

  // ---------- war machines and the spell book ----------

  const machines = $derived(warMachines(edition));

  function setMachine(slot: number, artifactId: number, present: boolean): void {
    if (present) {
      hero.equipment[slot] = artifactId;
    } else if (hero.equipment[slot] === artifactId) {
      hero.equipment[slot] = null;
    }
  }

  /** On the figure a machine slot switches its first machine, or takes off what is there. */
  function toggleMachineSlot(slot: number): void {
    const first = machines.find((machine) => machine.slot === slot);
    if ((hero.equipment[slot] ?? null) !== null) {
      hero.equipment[slot] = null;
    } else if (first) {
      hero.equipment[slot] = first.artifactId;
    }
  }

  const machineTitle = (slot: number): string => {
    const artifactId = hero.equipment[slot] ?? null;
    const fallback = machines.find((machine) => machine.slot === slot)?.artifactId;
    const shown = artifactId ?? fallback;
    const label = shown === undefined ? '' : name(shown);
    return t('heroDialog.slotState', {
      slot: label,
      state: t(artifactId === null ? 'heroDialog.machineAbsent' : 'heroDialog.machinePresent'),
    });
  };

  const selectedLock = $derived(locks.get(selected));
  const selectedArtifact = $derived(hero.equipment[selected] ?? null);
</script>

<div class="equipment">
  <div class="doll" role="group" aria-label={t('heroDialog.equipmentSlots')}>
    <svg class="figure" viewBox="0 0 1128 1360" aria-hidden="true">
      <path
        class="cape"
        d="M60 250C70 205 125 205 140 262L300 318C380 290 450 272 515 268L680 262C740 285 790 310 810 345L775 362C820 450 850 520 860 545C900 700 960 860 1015 1010C990 1040 940 1060 900 1080L715 1145L520 1160L430 1010L425 430L295 412C220 380 120 330 60 300Z"
      />
      <path
        class="body"
        d="M425 330C520 300 640 292 712 330L725 600L712 1100L695 1315L605 1310L590 1205L470 1232L460 1212L525 1150L470 820L430 450Z"
      />
      <path class="body" d="M728 480C750 560 760 680 755 785L850 778C860 700 850 600 835 545Z" />
    </svg>

    {#each wornSlots as slot (slot.index)}
      {@const owner = locks.get(slot.index)}
      {@const artifactId = hero.equipment[slot.index] ?? null}
      <button
        type="button"
        class="cell"
        class:active={selected === slot.index}
        class:locked={owner !== undefined}
        style={place(slot.key)}
        aria-label={t('heroDialog.slotState', {
          slot: equipmentSlotName(slot.index),
          state: slotState(slot.index),
        })}
        aria-pressed={selected === slot.index}
        use:tooltip={`${equipmentSlotName(slot.index)}: ${slotState(slot.index)}`}
        onclick={() => (selected = slot.index)}
      >
        {#if owner !== undefined}
          <span class="lock"><Icon name="lock" size={22} /></span>
        {:else if artifactId !== null}
          <ArtifactIcon {artifactId} size={36} />
        {/if}
        {#if changed(slot.index)}<span class="mark" aria-hidden="true"></span>{/if}
      </button>
    {/each}

    {#each WAR_MACHINE_SLOTS as { index: slot, key } (slot)}
      {@const artifactId = hero.equipment[slot] ?? null}
      {@const shown = artifactId ?? machines.find((machine) => machine.slot === slot)?.artifactId}
      <button
        type="button"
        class="cell"
        class:off={artifactId === null}
        style={place(key)}
        aria-label={machineTitle(slot)}
        aria-pressed={artifactId !== null}
        use:tooltip={machineTitle(slot)}
        onclick={() => toggleMachineSlot(slot)}
      >
        {#if shown !== undefined}<WarMachineIcon artifactId={shown} size={44} />{/if}
        {#if changed(slot)}<span class="mark" aria-hidden="true"></span>{/if}
      </button>
    {/each}

    <button
      type="button"
      class="cell book"
      class:off={!hero.hasSpellBook}
      style={place('spellBook')}
      aria-label={t('heroDialog.slotState', {
        slot: t('heroDialog.spellBook'),
        state: t(hero.hasSpellBook ? 'heroDialog.machinePresent' : 'heroDialog.machineAbsent'),
      })}
      aria-pressed={hero.hasSpellBook}
      use:tooltip={t('heroDialog.spellBookHint')}
      onclick={() => (hero.hasSpellBook = !hero.hasSpellBook)}
    >
      <SpellBookIcon />
      {#if hero.hasSpellBook !== openedSpellBook}<span class="mark" aria-hidden="true"></span>{/if}
    </button>

    <svg class="figure outline" viewBox="0 0 1128 1360" aria-hidden="true">
      <path d="M520 255C505 150 530 50 600 32C670 50 695 150 680 255M520 255L595 335L680 255" />
      <circle cx="595" cy="350" r="18" />
      <path
        d="M60 250C70 205 125 205 140 262L300 318C380 290 450 272 515 268M680 262C740 285 790 310 810 345L775 362C820 450 850 520 860 545C900 700 960 860 1015 1010C990 1040 940 1060 900 1080L715 1145M695 1145L695 1315L605 1310L590 1205L470 1232L460 1212L525 1150L430 1010L425 430L295 412C220 380 120 330 60 300L60 250"
      />
      <path d="M728 480C750 560 760 680 755 785L850 778C860 700 850 600 835 545" />
    </svg>
  </div>

  <div class="side">
    <div class="card">
      <div class="slot-name">{equipmentSlotName(selected)}</div>
      {#if selectedLock !== undefined}
        <div class="current">
          <span class="lock"><Icon name="lock" size={28} /></span>
          <div>
            <div class="artifact">{ownerName(selectedLock)}</div>
            <div class="effect">{t('heroDialog.slotTakenHint')}</div>
          </div>
        </div>
      {:else}
        <div class="current">
          {#if selectedArtifact !== null}
            <ArtifactIcon artifactId={selectedArtifact} size={40} />
          {:else}
            <span class="empty-badge"></span>
          {/if}
          <div>
            <div class="artifact">
              {selectedArtifact === null ? t('hero.emptySlot') : name(selectedArtifact)}
            </div>
            <div class="effect">
              {selectedArtifact === null
                ? t('heroDialog.nothingWorn')
                : (artifactDescription(selectedArtifact, edition) ?? '')}
            </div>
          </div>
        </div>
        <div class="wear">
          <div class="field">
            <Combobox
              label={t('heroDialog.wearOther')}
              placeholder={t('heroDialog.findArtifact')}
              {items}
              bind:value={pick}
              bind:text={search}
              onpick={onPick}
            >
              {#snippet optionIcon(item)}
                <ArtifactIcon artifactId={item.value} />
              {/snippet}
            </Combobox>
          </div>
          <Button disabled={selectedArtifact === null} onclick={takeOff}>
            {t('heroDialog.takeOff')}
          </Button>
        </div>
      {/if}

      <div class="block">
        <h3>{t('heroDialog.warMachines')}</h3>
        <div class="machines">
          {#each machines as { slot, artifactId } (artifactId)}
            <Checkbox
              label={name(artifactId)}
              checked={hero.equipment[slot] === artifactId}
              onchange={(present) => setMachine(slot, artifactId, present)}
            >
              {#snippet icon()}
                <WarMachineIcon {artifactId} />
              {/snippet}
            </Checkbox>
          {/each}
        </div>
      </div>

      <div class="block">
        <Checkbox
          label={t('heroDialog.spellBook')}
          hint={t('heroDialog.spellBookHint')}
          bind:checked={hero.hasSpellBook}
        >
          {#snippet icon()}<SpellBookIcon />{/snippet}
        </Checkbox>
      </div>
    </div>

    <div class="backpack">
      <Checkbox
        label={t('heroDialog.moveToBackpack')}
        hint={t('heroDialog.moveToBackpackHint')}
        checked={preferences.moveToBackpack}
        onchange={setMoveToBackpack}
      />
      <span class="count" class:full={hero.backpack.length >= max}>
        {t('heroDialog.backpack', { count: hero.backpack.length, max })}
      </span>
    </div>
  </div>
</div>

<Dialog bind:open={questionOpen} title={question?.title ?? ''} size="small">
  {#if question}
    {#if question.list}
      <p>{t('heroDialog.combinationText')}</p>
      <ul>
        {#each question.list as item (item)}
          <li>{item}</li>
        {/each}
      </ul>
    {/if}
    {#each question.lines as line (line.text)}
      <p class:muted={line.tone === 'muted'} class:danger={line.tone === 'danger'}>{line.text}</p>
    {/each}
  {/if}
  {#snippet footer()}
    <Button onclick={() => (questionOpen = false)}>{t('common.cancel')}</Button>
    <Button variant={question?.danger ? 'danger' : 'primary'} onclick={answer}>
      {question?.okLabel ?? ''}
    </Button>
  {/snippet}
</Dialog>

<style>
  .equipment {
    display: grid;
    grid-template-columns: minmax(0, 400px) minmax(0, 1fr);
    gap: var(--space-5);
    align-items: start;
  }

  /* The slots keep the proportions of the game's hero screen at any width. */
  .doll {
    position: relative;
    width: 100%;
    aspect-ratio: 1128 / 1360;
  }

  .figure {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .cape {
    fill: var(--color-frame-soft);
    opacity: 0.3;
  }

  .body {
    fill: var(--color-frame-soft);
    opacity: 0.6;
  }

  /* The gold outline runs over the slot squares, as in the game, but under the badges. */
  .outline {
    z-index: 1;
    fill: none;
    stroke: var(--color-frame);
    stroke-width: 7;
    stroke-linejoin: round;
    stroke-linecap: round;
    opacity: 0.85;
  }

  .cell {
    position: absolute;
    width: calc(175 / 1128 * 100%);
    height: calc(175 / 1360 * 100%);
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid var(--color-frame-soft);
    border-radius: var(--radius-small);
    background: var(--color-panel);
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .cell > :global(*) {
    position: relative;
    z-index: 2;
  }

  .cell:hover {
    border-color: var(--color-frame);
  }

  .cell.active {
    border-color: var(--color-focus);
    box-shadow: 0 0 0 1px var(--color-focus);
  }

  .cell.locked {
    background: repeating-linear-gradient(
      135deg,
      var(--color-panel) 0 5px,
      var(--color-unsaved-soft) 5px 10px
    );
  }

  .cell.off > :global(:not(.mark)) {
    opacity: 0.35;
  }

  .book :global(.tome) {
    width: 34px;
    height: 34px;
  }

  .mark {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-spell-added);
  }

  .side {
    display: grid;
    gap: var(--space-3);
  }

  .backpack {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-frame-soft);
    border-radius: var(--radius);
  }

  .count {
    flex: none;
    white-space: nowrap;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .count.full {
    color: var(--color-error-text);
  }

  .card {
    padding: var(--space-4);
    border: 1px solid var(--color-frame-soft);
    border-radius: var(--radius);
  }

  .slot-name {
    font-size: 13px;
    color: var(--color-label);
  }

  .current {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin: var(--space-2) 0 var(--space-4);
  }

  .artifact {
    font-family: var(--font-heading);
    font-size: 17px;
    color: var(--color-heading);
  }

  .effect {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .empty-badge {
    flex: none;
    width: 40px;
    height: 40px;
    border: 1px dashed var(--color-frame-soft);
    border-radius: var(--radius-small);
  }

  .lock {
    display: flex;
    color: var(--color-text-muted);
  }

  .wear {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
  }

  .field {
    flex: 1;
    min-width: 0;
    display: grid;
  }

  .block {
    margin-top: var(--space-4);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-frame-soft);
  }

  h3 {
    margin: 0 0 var(--space-1);
    font-size: 14px;
  }

  .machines {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
  }

  p {
    margin: 0 0 var(--space-2);
  }

  ul {
    margin: 0 0 var(--space-2);
    padding-left: var(--space-4);
  }

  .muted {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .danger {
    font-size: 13px;
    color: var(--color-error-text);
  }

  @media (max-width: 760px) {
    .equipment {
      grid-template-columns: minmax(0, 1fr);
    }

    .doll {
      max-width: 400px;
      margin: 0 auto;
    }
  }
</style>
