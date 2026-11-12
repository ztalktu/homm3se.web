<script lang="ts">
  import type { Hero } from '../../../core/hero';
  import {
    MAX_SECONDARY_SKILLS,
    SECONDARY_SKILL_COUNT,
    SKILL_LEVELS,
    type SkillLevel,
  } from '../../../data/skills';
  import { skillLevelName, skillName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import Combobox from '../../components/Combobox.svelte';
  import type { ComboboxItem } from '../../components/combobox';
  import SkillIcon from './SkillIcon.svelte';
  import SkillLevelIcon from './SkillLevelIcon.svelte';

  interface Props {
    hero: Hero;
  }

  let { hero = $bindable() }: Props = $props();

  /** The "(nothing)" option that clears a slot. */
  const NONE = -1;
  const skillIds = Array.from({ length: SECONDARY_SKILL_COUNT }, (_, id) => id);

  /** Filled rows plus one empty row to add a skill, up to eight. */
  const rows = $derived(
    Array.from(
      { length: Math.min(hero.secondarySkills.length + 1, MAX_SECONDARY_SKILLS) },
      (_, row) => row,
    ),
  );

  const levelOptions: ComboboxItem<SkillLevel>[] = $derived(
    SKILL_LEVELS.map((level) => ({ value: level, label: skillLevelName(level) })),
  );

  function skillOptions(row: number): ComboboxItem<number>[] {
    const takenElsewhere = new Set(
      hero.secondarySkills.filter((_, index) => index !== row).map((skill) => skill.skillId),
    );
    return [
      { value: NONE, label: t('heroDialog.noSkill') },
      ...skillIds.map((id) => ({
        value: id,
        label: skillName(id),
        disabled: takenElsewhere.has(id),
      })),
    ];
  }

  function setSkill(row: number, skillId: number): void {
    if (skillId === NONE) {
      // Clearing a skill moves the ones below it up, so the slots stay filled from the top.
      hero.secondarySkills.splice(row, 1);
      return;
    }
    const existing = hero.secondarySkills[row];
    if (existing) {
      existing.skillId = skillId;
    } else {
      hero.secondarySkills.push({ skillId, level: 1 });
    }
  }

  function setLevel(row: number, level: SkillLevel): void {
    const skill = hero.secondarySkills[row];
    if (skill) {
      skill.level = level;
    }
  }
</script>

<div class="table">
  {#each rows as row (row)}
    {@const skill = hero.secondarySkills[row]}
    <Combobox
      label={t('heroDialog.skillSlot', { slot: row + 1 })}
      inlineLabel
      items={skillOptions(row)}
      value={skill?.skillId ?? NONE}
      onchange={(skillId) => skillId !== null && setSkill(row, skillId)}
    >
      {#snippet before()}
        <SkillIcon skillId={skill?.skillId ?? null} />
      {/snippet}
      {#snippet optionIcon(item)}
        <SkillIcon skillId={item.value === NONE ? null : item.value} />
      {/snippet}
    </Combobox>
    <Combobox
      label={t('heroDialog.skillLevel')}
      inlineLabel
      items={levelOptions}
      value={skill?.level ?? 1}
      disabled={!skill}
      onchange={(level) => level !== null && setLevel(row, level)}
    >
      {#snippet before()}
        <SkillLevelIcon level={skill?.level ?? null} />
      {/snippet}
      {#snippet optionIcon(item)}
        <SkillLevelIcon level={item.value} />
      {/snippet}
    </Combobox>
  {/each}
</div>
<p class="note">{t('heroDialog.skillsHint')}</p>

<style>
  .note {
    margin: var(--space-3) 0 0;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .table {
    display: grid;
    grid-template-columns: auto minmax(0, 2fr) auto minmax(120px, 1fr);
    gap: var(--space-2) var(--space-3);
  }

  /* On a phone the level goes under its skill. */
  @media (max-width: 520px) {
    .table {
      grid-template-columns: auto minmax(0, 1fr);
    }
  }
</style>
