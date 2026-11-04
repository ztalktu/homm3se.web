<script lang="ts">
  import { session } from '../../../app/session.svelte';
  import { experienceForLevel, levelForExperience } from '../../../core/experience';
  import type { Hero } from '../../../core/hero';
  import { HERO_LIMITS } from '../../../core/rules';
  import { isAvailableIn } from '../../../data/editions';
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

  // The two boxes exclude each other, like in 2.05.
  let autoExperience = $state(false);
  let autoLevel = $state(false);

  const classOptions = $derived(
    HERO_CLASSES.map((heroClass) => ({
      value: String(heroClass.id),
      label: heroClassName(heroClass.id),
      disabled: !isAvailableIn(heroClass.introducedIn, session.edition),
    })),
  );

  function onLevelChange(level: number): void {
    if (autoExperience) {
      hero.experience = experienceForLevel(level);
    }
  }

  function onExperienceChange(experience: number): void {
    if (autoLevel) {
      hero.level = levelForExperience(experience);
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
        max={HERO_LIMITS.level}
        disabled={autoLevel}
        onchange={onLevelChange}
      />
      <NumberField
        label={t('hero.experience')}
        bind:value={hero.experience}
        max={HERO_LIMITS.experience}
        bigStep={1000}
        disabled={autoExperience}
        onchange={onExperienceChange}
      />
      <Checkbox
        label={t('heroDialog.autoExperience')}
        hint={t('heroDialog.autoExperienceHint')}
        bind:checked={autoExperience}
        onchange={(checked) => {
          if (checked) {
            autoLevel = false;
            onLevelChange(hero.level);
          }
        }}
      />
      <Checkbox
        label={t('heroDialog.autoLevel')}
        hint={t('heroDialog.autoLevelHint')}
        bind:checked={autoLevel}
        onchange={(checked) => {
          if (checked) {
            autoExperience = false;
            onExperienceChange(hero.experience);
          }
        }}
      />
    </div>
  </Fieldset>

  <Fieldset legend={t('heroDialog.primarySkills')}>
    <div class="pairs">
      <NumberField
        label={t('hero.attack')}
        bind:value={hero.attack}
        max={HERO_LIMITS.primarySkill}
      />
      <NumberField
        label={t('hero.defense')}
        bind:value={hero.defense}
        max={HERO_LIMITS.primarySkill}
      />
      <NumberField
        label={t('hero.spellPower')}
        bind:value={hero.spellPower}
        max={HERO_LIMITS.primarySkill}
      />
      <NumberField
        label={t('hero.knowledge')}
        bind:value={hero.knowledge}
        max={HERO_LIMITS.primarySkill}
      />
    </div>
  </Fieldset>

  <Fieldset legend={t('heroDialog.manaAndMovement')}>
    <div class="pairs">
      <NumberField label={t('hero.mana')} bind:value={hero.mana} max={HERO_LIMITS.mana} />
      <NumberField
        label={t('hero.movementPoints')}
        bind:value={hero.movementPoints}
        max={HERO_LIMITS.movementPoints}
      />
    </div>
  </Fieldset>
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
</style>
