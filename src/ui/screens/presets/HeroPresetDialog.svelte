<script lang="ts" module>
  import type { HeroAttribute, HeroPresetChoice, HeroSection } from '../../../core/presets';

  /** Name and class stay off unless picked, as in the 2.05 editor: a preset is mostly for others. */
  const DEFAULT_ATTRIBUTES: Readonly<Record<HeroAttribute, boolean>> = {
    name: false,
    classId: false,
    level: true,
    experience: true,
    attack: true,
    defense: true,
    spellPower: true,
    knowledge: true,
    mana: true,
    movementPoints: true,
    maxMovementPoints: true,
  };

  /** What the last load took, so the next one starts the same (as the 2.05 editor did). */
  let lastLoad: Omit<HeroPresetChoice, 'attributes' | 'sections'> & {
    attributes: Record<HeroAttribute, boolean>;
    sections: Record<HeroSection, boolean>;
  } = {
    attributes: { ...DEFAULT_ATTRIBUTES },
    sections: { troops: true, skills: true, equipment: true, backpack: true, spells: true },
    backpack: 'add',
    spells: 'add',
  };
</script>

<script lang="ts">
  /**
   * Saving the hero of the window as a preset, or loading one onto it: the attributes one by
   * one, the other tabs as a whole. Loading changes the window's draft only.
   */
  import { preferences } from '../../../app/preferences.svelte';
  import { presetsOf, savePreset, type Preset } from '../../../app/presets.svelte';
  import { saveLimits, session } from '../../../app/session.svelte';
  import { showToast } from '../../../app/toasts.svelte';
  import { type Edition } from '../../../data/editions';
  import { WAR_MACHINE_SLOTS, WORN_SLOTS } from '../../../data/equipment';
  import { SPELL_LEVELS, SPELLS } from '../../../data/spells';
  import type { Hero } from '../../../core/hero';
  import { COMMON_HERO_FIELDS } from '../../../core/layouts';
  import {
    applyHeroPreset,
    HERO_ATTRIBUTES,
    HERO_SECTIONS,
    heroPresetData,
    type HeroPresetData,
    type SkippedItem,
  } from '../../../core/presets';
  import {
    artifactName,
    creatureName,
    editionName,
    heroClassName,
    skillLevelName,
    skillName,
    spellName,
  } from '../../../i18n/game.svelte';
  import { equipmentSlotName, t, type MessageKey } from '../../../i18n/index.svelte';
  import type { TooltipList } from '../../actions/tooltip';
  import RadioGroup from '../../components/RadioGroup.svelte';
  import Fieldset from '../../components/Fieldset.svelte';
  import type { IconName } from '../../components/icons';
  import { formatDate, formatNumber } from '../../format';
  import { placeTakenOff } from '../../logic/takenOff';
  import WarningNote from '../shared/WarningNote.svelte';
  import {
    hint,
    listRows,
    skippedGroup,
    slotRows,
    troopLabel,
    troopSlotLabels,
    valueRow,
  } from './hints';
  import PresetDialog from './PresetDialog.svelte';
  import PresetSection from './PresetSection.svelte';
  import PresetValues from './PresetValues.svelte';

  interface Props {
    mode: 'save' | 'load';
    /** The hero of the window, as edited so far. */
    hero: Hero;
    onload: (hero: Hero) => void;
    onclose: () => void;
  }

  let { mode, hero: draft, onload, onclose }: Props = $props();

  /** A plain copy: the presets code clones it, and a state proxy cannot be cloned. */
  const hero = $derived($state.snapshot(draft) as Hero);

  let open = $state(true);
  $effect(() => {
    if (!open) {
      onclose();
    }
  });

  const edition = $derived(session.edition);
  const presets = $derived(presetsOf('hero'));
  // svelte-ignore state_referenced_locally
  let name = $state(
    mode === 'save'
      ? t('preset.defaultName', { name: draft.name, date: formatDate(Date.now()) })
      : (presetsOf('hero')[0]?.name ?? ''),
  );
  // svelte-ignore state_referenced_locally
  let attributes: Record<HeroAttribute, boolean> = $state(
    mode === 'save' ? { ...DEFAULT_ATTRIBUTES } : { ...lastLoad.attributes },
  );
  // svelte-ignore state_referenced_locally
  let sections: Record<HeroSection, boolean> = $state(
    mode === 'save'
      ? (Object.fromEntries(HERO_SECTIONS.map((section) => [section, true])) as Record<
          HeroSection,
          boolean
        >)
      : { ...lastLoad.sections },
  );
  let backpackMode = $state(lastLoad.backpack);
  let spellsMode = $state(lastLoad.spells);

  const preset: Preset<'hero'> | undefined = $derived(
    mode === 'load' ? presets.find((known) => known.name === name) : undefined,
  );
  /** What the right columns show: the preset's values when loading, the hero's when saving. */
  const shown: HeroPresetData = $derived(
    preset?.data ?? heroPresetData(hero, HERO_ATTRIBUTES, HERO_SECTIONS),
  );
  /** Edition the shown ids belong to. */
  const shownEdition: Edition = $derived(preset?.edition ?? edition);
  const target = $derived({ from: shownEdition, to: edition, limits: saveLimits() });

  const hasAttribute = (field: HeroAttribute): boolean => shown.attributes?.[field] !== undefined;
  const hasSection = (section: HeroSection): boolean => shown[section] !== undefined;
  const chosenAttributes = $derived(
    HERO_ATTRIBUTES.filter((f) => attributes[f] && hasAttribute(f)),
  );
  const chosenSections = $derived(HERO_SECTIONS.filter((s) => sections[s] && hasSection(s)));
  const choice = $derived({
    attributes: chosenAttributes,
    sections: chosenSections,
    backpack: backpackMode,
    spells: spellsMode,
  });

  // ---------- names ----------

  const ATTRIBUTE_LABELS: Record<HeroAttribute, MessageKey> = {
    name: 'hero.name',
    classId: 'hero.class',
    level: 'hero.level',
    experience: 'hero.experience',
    attack: 'hero.attack',
    defense: 'hero.defense',
    spellPower: 'hero.spellPower',
    knowledge: 'hero.knowledge',
    mana: 'hero.mana',
    movementPoints: 'hero.movementPoints',
    maxMovementPoints: 'hero.maxMovementPoints',
  };

  const SECTION_TABS: Record<HeroSection, { label: MessageKey; icon: IconName }> = {
    troops: { label: 'heroDialog.tab.troops', icon: 'troops' },
    skills: { label: 'heroDialog.tab.skills', icon: 'skills' },
    equipment: { label: 'heroDialog.tab.equipment', icon: 'equipment' },
    backpack: { label: 'heroDialog.tab.artifacts', icon: 'chest' },
    spells: { label: 'heroDialog.tab.spells', icon: 'spells' },
  };

  function attributeValue(field: HeroAttribute, value: string | number | undefined): string {
    if (value === undefined) {
      return '—';
    }
    if (field === 'name') {
      return String(value);
    }
    return field === 'classId' ? heroClassName(Number(value)) : formatNumber(Number(value));
  }

  const skillLabel = ({ skillId, level }: Hero['secondarySkills'][number]): string =>
    t('preset.skillRow', {
      skill: skillName(skillId),
      level: skillLevelName(level).toLocaleLowerCase(),
    });
  const artifactNames = (ids: readonly number[], from: Edition): string[] =>
    ids.map((id) => artifactName(id, from));
  const machines = (equipment: readonly (number | null)[], from: Edition): string[] =>
    WAR_MACHINE_SLOTS.flatMap(({ index }) => {
      const id = equipment[index] ?? null;
      return id === null ? [] : [artifactName(id, from)];
    });

  function skippedName({ kind, id }: SkippedItem, from: Edition): string {
    switch (kind) {
      case 'class':
        return heroClassName(id);
      case 'creature':
        return creatureName(id, from);
      case 'skill':
        return skillName(id);
      case 'spell':
        return spellName(id);
      default:
        return artifactName(id, from);
    }
  }

  // ---------- summaries and hints ----------

  function summary(section: HeroSection, data: HeroPresetData, from: Edition): string {
    switch (section) {
      case 'troops':
        return (data.troops ?? []).flatMap((troop) => troopLabel(troop, from) ?? []).join(', ');
      case 'skills':
        return (data.skills ?? []).map(skillLabel).join(', ');
      case 'equipment': {
        const worn = WORN_SLOTS.filter(({ index }) => (data.equipment?.[index] ?? null) !== null);
        return [
          t('preset.worn', { count: worn.length }),
          ...machines(data.equipment ?? [], from),
        ].join(', ');
      }
      case 'backpack':
        return t('preset.artifacts', { count: data.backpack?.length ?? 0 });
      case 'spells':
        return [
          t('preset.spells', { count: data.spells?.spells.length ?? 0 }),
          ...(data.spells?.hasSpellBook ? [t('preset.withSpellBook')] : []),
        ].join(', ');
    }
  }

  function spellGroups(
    after: readonly number[],
    before?: readonly number[],
  ): TooltipList['groups'] {
    return SPELL_LEVELS.flatMap((level) => {
      const ofLevel = (ids: readonly number[]): string[] =>
        ids.filter((id) => SPELLS[id]?.level === level).map(spellName);
      const rows = listRows(ofLevel(after), before && ofLevel(before));
      return rows.length > 0 ? [{ label: t('preset.spellLevel', { level }), rows }] : [];
    });
  }

  function skillRows(after: Hero['secondarySkills'], before?: Hero['secondarySkills']) {
    if (!before) {
      return listRows(after.map(skillLabel));
    }
    const rows = after.map((skill) => {
      const was = before.find(({ skillId }) => skillId === skill.skillId);
      if (!was) {
        return { text: skillLabel(skill), mark: 'added' as const };
      }
      return was.level === skill.level
        ? { text: skillLabel(skill), mark: 'same' as const }
        : {
            text: t('preset.change', { from: skillLabel(was), to: skillLabel(skill) }),
            mark: 'changed' as const,
          };
    });
    const gone = before.filter(({ skillId }) => !after.some((skill) => skill.skillId === skillId));
    return [
      ...rows,
      ...gone.map((skill) => ({ text: skillLabel(skill), mark: 'removed' as const })),
    ];
  }

  /** Saving: what the section holds. */
  function saveHint(section: HeroSection): TooltipList {
    const title = t(SECTION_TABS[section].label);
    switch (section) {
      case 'troops':
        return hint(title, [
          {
            rows: slotRows(
              troopSlotLabels(),
              hero.troops.map((troop) => troopLabel(troop, edition)),
            ),
          },
        ]);
      case 'skills':
        return hint(title, [{ rows: skillRows(hero.secondarySkills) }]);
      case 'equipment':
        return hint(title, equipmentGroups(hero.equipment));
      case 'backpack':
        return hint(title, [{ rows: listRows(artifactNames(hero.backpack, edition)) }]);
      case 'spells':
        return hint(
          title,
          spellGroups(hero.spells),
          hero.hasSpellBook ? t('heroDialog.spellBook') : undefined,
        );
    }
  }

  function equipmentGroups(
    after: readonly (number | null)[],
    before?: readonly (number | null)[],
  ): TooltipList['groups'] {
    const worn = (equipment: readonly (number | null)[]): (string | null)[] =>
      WORN_SLOTS.map(({ index }) => {
        const id = equipment[index] ?? null;
        return id === null ? null : artifactName(id, edition);
      });
    const labels = WORN_SLOTS.map(({ index }) => equipmentSlotName(index));
    const machineRows = listRows(machines(after, edition), before && machines(before, edition));
    return [
      { rows: slotRows(labels, worn(after), before && worn(before)) },
      ...(machineRows.length > 0
        ? [{ label: t('heroDialog.warMachines'), rows: machineRows }]
        : []),
    ];
  }

  /** Loading one section: what it changes on the hero of the window. */
  function loadHint(section: HeroSection, data: HeroPresetData): TooltipList {
    const title = t(SECTION_TABS[section].label);
    const result = applyHeroPreset(
      hero,
      data,
      { attributes: [], sections: [section], backpack: backpackMode, spells: spellsMode },
      target,
    );
    const after = result.hero;
    const skipped = skippedGroup(result.skipped.map((item) => skippedName(item, target.from)));
    switch (section) {
      case 'troops':
        return hint(
          title,
          [
            {
              rows: slotRows(
                troopSlotLabels(),
                after.troops.map((troop) => troopLabel(troop, edition)),
                hero.troops.map((troop) => troopLabel(troop, edition)),
              ),
            },
            ...skipped,
          ],
          t('preset.bySlot'),
        );
      case 'skills':
        return hint(
          title,
          [{ rows: skillRows(after.secondarySkills, hero.secondarySkills) }, ...skipped],
          t('preset.whole'),
        );
      case 'equipment': {
        const free = COMMON_HERO_FIELDS.backpackSlots - after.backpack.length;
        const placed = placeTakenOff(result.takenOff, preferences.moveToBackpack, edition, free);
        const names = (ids: number[]): string => artifactNames(ids, edition).join(', ');
        return hint(
          title,
          [...equipmentGroups(after.equipment, hero.equipment), ...skipped],
          t('preset.whole'),
          placed.toBackpack.length > 0
            ? t('heroDialog.goesToBackpack', { names: names(placed.toBackpack) })
            : undefined,
          placed.deleted.length > 0
            ? t('heroDialog.willBeDeleted', { names: names(placed.deleted) })
            : undefined,
        );
      }
      case 'backpack':
        return hint(
          title,
          [
            {
              rows: listRows(
                artifactNames(after.backpack, edition),
                artifactNames(hero.backpack, edition),
              ),
            },
            ...skipped,
          ],
          t(backpackMode === 'add' ? 'preset.addsTo' : 'preset.whole'),
          t('preset.backpackAfter', {
            count: after.backpack.length,
            max: COMMON_HERO_FIELDS.backpackSlots,
          }),
        );
      case 'spells':
        return hint(
          title,
          [...spellGroups(after.spells, hero.spells), ...skipped],
          t(spellsMode === 'add' ? 'preset.addsTo' : 'preset.whole'),
          after.hasSpellBook && !hero.hasSpellBook ? t('preset.spellBookAdded') : undefined,
        );
    }
  }

  function attributeHint(field: HeroAttribute): TooltipList {
    const title = t(ATTRIBUTE_LABELS[field]);
    if (!preset) {
      return hint(title, [{ rows: [valueRow(attributeValue(field, hero[field]))] }]);
    }
    const result = applyHeroPreset(
      hero,
      preset.data,
      { attributes: [field], sections: [], backpack: 'add', spells: 'add' },
      target,
    );
    return hint(title, [
      {
        rows: [
          valueRow(attributeValue(field, result.hero[field]), attributeValue(field, hero[field])),
        ],
      },
      ...skippedGroup(result.skipped.map((item) => skippedName(item, target.from))),
    ]);
  }

  const attributeRows = $derived(
    HERO_ATTRIBUTES.map((field) => ({
      key: field,
      label: t(ATTRIBUTE_LABELS[field]),
      value: attributeValue(field, shown.attributes?.[field]),
      available: hasAttribute(field),
      hint: hasAttribute(field) ? attributeHint(field) : undefined,
    })),
  );

  /** Everything the chosen load would skip, for the note under the columns. */
  const skippedNames = $derived(
    preset
      ? [
          ...new Set(
            applyHeroPreset(hero, preset.data, choice, target).skipped.map((item) =>
              skippedName(item, target.from),
            ),
          ),
        ]
      : [],
  );

  const canApply = $derived(
    (mode === 'save' ? name.trim() !== '' : preset !== undefined) &&
      chosenAttributes.length + chosenSections.length > 0,
  );

  function apply(): void {
    if (mode === 'save') {
      const presetName = name.trim();
      savePreset('hero', {
        name: presetName,
        savedAt: Date.now(),
        edition,
        data: heroPresetData(hero, chosenAttributes, chosenSections),
      });
      showToast(t('preset.saved', { name: presetName }), { kind: 'success' });
    } else if (preset) {
      const result = applyHeroPreset(hero, preset.data, choice, target);
      const free = COMMON_HERO_FIELDS.backpackSlots - result.hero.backpack.length;
      const placed = placeTakenOff(result.takenOff, preferences.moveToBackpack, edition, free);
      result.hero.backpack.push(...placed.toBackpack);
      lastLoad = {
        attributes: { ...attributes },
        sections: { ...sections },
        backpack: backpackMode,
        spells: spellsMode,
      };
      onload(result.hero);
    }
    open = false;
  }

  const modes = $derived([
    { value: 'add' as const, label: t('preset.add') },
    { value: 'replace' as const, label: t('preset.replace') },
  ]);
</script>

<PresetDialog bind:open kind="hero" {mode} bind:name wide {canApply} onapply={apply}>
  <PresetValues
    legend={t('heroDialog.tab.attributes')}
    rows={attributeRows}
    bind:checked={attributes}
    available={HERO_ATTRIBUTES.some(hasAttribute)}
    unavailableText={t('preset.attributesNotSaved')}
  />
  <Fieldset legend={t('preset.other')}>
    <div class="sections">
      {#each HERO_SECTIONS as section (section)}
        {#snippet loadMode()}
          {#if section === 'backpack'}
            <RadioGroup
              legend={t('preset.backpackMode')}
              direction="row"
              options={modes}
              bind:value={backpackMode}
            />
          {:else}
            <RadioGroup
              legend={t('preset.spellsMode')}
              direction="row"
              options={modes}
              bind:value={spellsMode}
            />
          {/if}
        {/snippet}
        <PresetSection
          label={t(SECTION_TABS[section].label)}
          icon={SECTION_TABS[section].icon}
          bind:checked={sections[section]}
          available={hasSection(section)}
          summary={summary(section, shown, shownEdition)}
          hint={hasSection(section)
            ? preset
              ? loadHint(section, preset.data)
              : saveHint(section)
            : undefined}
          children={mode === 'load' && (section === 'backpack' || section === 'spells')
            ? loadMode
            : undefined}
        />
      {/each}
    </div>
  </Fieldset>

  {#snippet notes()}
    {#if mode === 'load'}
      {#if skippedNames.length > 0}
        <WarningNote
          text={t('preset.otherEdition', {
            edition: editionName(target.from),
            names: skippedNames.join(', '),
          })}
        />
      {/if}
    {/if}
  {/snippet}
</PresetDialog>

<style>
  .sections {
    display: grid;
    gap: var(--space-3);
  }
</style>
