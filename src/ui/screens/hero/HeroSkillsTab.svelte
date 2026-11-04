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
  import SelectField from '../../components/SelectField.svelte';

  interface Props {
    hero: Hero;
  }

  let { hero = $bindable() }: Props = $props();

  const NONE = 'none';
  const skillIds = Array.from({ length: SECONDARY_SKILL_COUNT }, (_, id) => id);

  /** Filled rows plus one empty row to add a skill, up to eight. */
  const rows = $derived(
    Array.from(
      { length: Math.min(hero.secondarySkills.length + 1, MAX_SECONDARY_SKILLS) },
      (_, row) => row,
    ),
  );

  const levelOptions = $derived(
    SKILL_LEVELS.map((level) => ({ value: String(level), label: skillLevelName(level) })),
  );

  function skillOptions(row: number): { value: string; label: string; disabled?: boolean }[] {
    const takenElsewhere = new Set(
      hero.secondarySkills.filter((_, index) => index !== row).map((skill) => skill.skillId),
    );
    return [
      { value: NONE, label: t('heroDialog.noSkill') },
      ...skillIds.map((id) => ({
        value: String(id),
        label: skillName(id),
        disabled: takenElsewhere.has(id),
      })),
    ];
  }

  function setSkill(row: number, value: string): void {
    if (value === NONE) {
      // Clearing a skill moves the ones below it up, so the slots stay filled from the top.
      hero.secondarySkills.splice(row, 1);
      return;
    }
    const skillId = Number(value);
    const existing = hero.secondarySkills[row];
    if (existing) {
      existing.skillId = skillId;
    } else {
      hero.secondarySkills.push({ skillId, level: 1 });
    }
  }

  function setLevel(row: number, value: string): void {
    const skill = hero.secondarySkills[row];
    if (skill) {
      skill.level = Number(value) as SkillLevel;
    }
  }
</script>

<p class="note">{t('heroDialog.skillsHint')}</p>
<div class="table">
  {#each rows as row (row)}
    {@const skill = hero.secondarySkills[row]}
    <SelectField
      label={t('heroDialog.skillSlot', { slot: row + 1 })}
      options={skillOptions(row)}
      value={skill ? String(skill.skillId) : NONE}
      onchange={(value) => setSkill(row, value)}
    />
    <SelectField
      label={t('heroDialog.skillLevel')}
      options={levelOptions}
      value={String(skill?.level ?? 1)}
      disabled={!skill}
      onchange={(value) => setLevel(row, value)}
    />
  {/each}
</div>

<style>
  .note {
    margin: 0 0 var(--space-3);
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .table {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(120px, 1fr);
    gap: var(--space-2) var(--space-3);
  }
</style>
