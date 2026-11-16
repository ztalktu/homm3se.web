<script lang="ts">
  import { saveLimits, session } from '../../../app/session.svelte';
  import { experienceForLevel, levelForExperience } from '../../../core/experience';
  import type { Hero } from '../../../core/hero';
  import { classAllowed, HERO_LIMITS, maxLevel, maxPrimarySkill } from '../../../core/rules';
  import { HERO_CLASSES } from '../../../data/heroClasses';
  import { heroClassName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import Checkbox from '../../components/Checkbox.svelte';
  import Fieldset from '../../components/Fieldset.svelte';
  import NumberField from '../../components/NumberField.svelte';
  import SelectField from '../../components/SelectField.svelte';
  import TextField from '../../components/TextField.svelte';

  interface Props {
    hero: Hero;
    nameError: string | undefined;
  }

  let { hero = $bindable(), nameError }: Props = $props();

  // By default the level is edited and the experience follows it;
  // with the box checked it is the other way round.
  let levelFromExperience = $state(false);

  const limits = $derived(saveLimits());
  const levelCap = $derived(maxLevel(session.edition));
  const skillCap = $derived(maxPrimarySkill(session.edition));
  const classOptions = $derived(
    HERO_CLASSES.map((heroClass) => ({
      value: String(heroClass.id),
      label: heroClassName(heroClass.id),
      disabled: !classAllowed(heroClass.id, session.edition, limits),
    })),
  );

  function onLevelChange(level: number): void {
    if (!levelFromExperience) {
      hero.experience = experienceForLevel(level, levelCap);
    }
  }

  function onExperienceChange(experience: number): void {
    if (levelFromExperience) {
      hero.level = levelForExperience(experience, levelCap);
    }
  }
</script>

<div class="grid">
  <Fieldset legend={t('heroDialog.hero')}>
    <div class="stack">
      <TextField label={t('hero.name')} bind:value={hero.name} maxlength={12} error={nameError} />
      <SelectField
        label={t('hero.class')}
        options={classOptions}
        value={String(hero.classId)}
        onchange={(value) => (hero.classId = Number(value))}
      />
    </div>
  </Fieldset>

  <Fieldset legend={t('heroDialog.heroLevel')}>
    <div class="stack">
      <NumberField
        label={t('hero.level')}
        bind:value={hero.level}
        min={1}
        max={levelCap}
        disabled={levelFromExperience}
        onchange={onLevelChange}
      />
      <NumberField
        label={t('hero.experience')}
        bind:value={hero.experience}
        max={HERO_LIMITS.experience}
        bigStep={1000}
        disabled={!levelFromExperience}
        onchange={onExperienceChange}
      />
      <Checkbox
        label={t('heroDialog.levelFromExperience')}
        hint={t('heroDialog.levelFromExperienceHint')}
        bind:checked={levelFromExperience}
        onchange={(checked) => {
          if (checked) {
            onExperienceChange(hero.experience);
          }
        }}
      />
    </div>
  </Fieldset>

  <Fieldset legend={t('heroDialog.primarySkills')}>
    <div class="pairs">
      <NumberField label={t('hero.attack')} bind:value={hero.attack} max={skillCap} />
      <NumberField label={t('hero.defense')} bind:value={hero.defense} max={skillCap} />
      <NumberField label={t('hero.spellPower')} bind:value={hero.spellPower} max={skillCap} />
      <NumberField label={t('hero.knowledge')} bind:value={hero.knowledge} max={skillCap} />
    </div>
  </Fieldset>

  <div class="wide">
    <Fieldset legend={t('heroDialog.manaAndMovement')}>
      <div class="row">
        <NumberField label={t('hero.mana')} bind:value={hero.mana} max={HERO_LIMITS.mana} />
        <NumberField
          label={t('hero.movementPoints')}
          bind:value={hero.movementPoints}
          max={HERO_LIMITS.movementPoints}
          bigStep={100}
        />
        <NumberField
          label={t('hero.maxMovementPoints')}
          bind:value={hero.maxMovementPoints}
          max={HERO_LIMITS.movementPoints}
          bigStep={100}
        />
      </div>
    </Fieldset>
  </div>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-4);
  }

  .stack {
    display: grid;
    gap: var(--space-3);
  }

  .pairs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }

  .wide {
    grid-column: 1 / -1;
  }

  .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-3);
  }
</style>
