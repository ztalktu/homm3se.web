<script lang="ts">
  /**
   * Development-only page with every component in its states (open #showcase in dev mode).
   * Not part of the production bundle, so its sample texts are not translated.
   */
  import { showToast } from '../../app/toasts.svelte';
  import Button from '../components/Button.svelte';
  import Checkbox from '../components/Checkbox.svelte';
  import Combobox from '../components/Combobox.svelte';
  import type { ComboboxItem } from '../components/combobox';
  import Dialog from '../components/Dialog.svelte';
  import Fieldset from '../components/Fieldset.svelte';
  import Icon from '../components/Icon.svelte';
  import NumberField from '../components/NumberField.svelte';
  import RadioGroup from '../components/RadioGroup.svelte';
  import SelectField from '../components/SelectField.svelte';
  import TextField from '../components/TextField.svelte';
  import { ICONS, type IconName } from '../components/icons';
  import { ARTIFACTS } from '../../data/artifacts';
  import { CREATURES } from '../../data/creatures';
  import { EDITIONS, isAvailableIn, type Edition } from '../../data/editions';
  import { HERO_NAMES, type GameLanguage } from '../../data/heroNames';
  import {
    artifactDescription,
    artifactName,
    creatureDescription,
    creatureName,
    editionName,
  } from '../../i18n/game.svelte';

  const iconNames = Object.keys(ICONS) as IconName[];

  let heroName = $state('Gelu');
  let heroValue: string | null = $state('Gelu');
  let experience = $state(25280);
  let attack = $state(4);
  let gold = $state(999999999);
  let name = $state('');
  let skillLevel: 'basic' | 'advanced' | 'expert' = $state('expert');
  let artifactMode: 'add' | 'overwrite' = $state('add');
  let spellBook = $state(true);
  let autoLevel = $state(false);
  let creature: number | null = $state(13);
  let dialogOpen = $state(false);

  let edition: Edition = $state('inTheWakeOfGods');
  let gameLanguage: GameLanguage = $state('english');
  let artifact: number | null = $state(7);

  const heroes: ComboboxItem<string>[] = $derived(
    HERO_NAMES[gameLanguage].map((heroNameOption) => ({
      value: heroNameOption,
      label: heroNameOption,
    })),
  );

  // Real reference data in the interface language, limited to the selected edition.
  const creatures: ComboboxItem<number>[] = $derived(
    CREATURES.map((item) => ({
      value: item.id,
      label: creatureName(item.id),
      description: creatureDescription(item),
      keywords: item.town,
      disabled: item.kind === 'placeholder' || !isAvailableIn(item.introducedIn, edition),
    })),
  );

  const artifacts: ComboboxItem<number>[] = $derived(
    ARTIFACTS.map((item) => ({
      value: item.id,
      label: artifactName(item.id),
      description: artifactDescription(item.id),
      disabled: !isAvailableIn(item.introducedIn, edition),
    })),
  );
</script>

<div class="showcase">
  <h2>Component showcase</h2>

  <Fieldset legend="Buttons">
    <div class="row">
      <Button variant="primary" icon="search">Find hero</Button>
      <Button icon="search">Find next</Button>
      <Button variant="danger" icon="trash">Delete template</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </div>
    <div class="row">
      <Button variant="primary" size="small">Small primary</Button>
      <Button size="small" icon="plus">Add to backpack</Button>
      <Button icon="open" label="Open a save file" hint="Open a save file (Ctrl+O)" />
      <Button icon="save" label="Save as" hint="Save as (Ctrl+S)" />
      <Button icon="settings" label="Settings" hint="Settings" />
      <Button variant="primary" icon="hero" label="Hero" hint="Hero parameters" />
    </div>
  </Fieldset>

  <Fieldset legend="Icons">
    <div class="icons">
      {#each iconNames as iconName (iconName)}
        <span class="icon-cell"><Icon name={iconName} size={22} /><small>{iconName}</small></span>
      {/each}
    </div>
  </Fieldset>

  <div class="grid">
    <Fieldset legend="Hero">
      <div class="stack">
        <Combobox
          label="Hero name"
          items={heroes}
          bind:value={heroValue}
          bind:text={heroName}
          allowCustom
          placeholder="Start typing a name"
          hint="Pick from the list or type the name exactly as the game spells it"
        />
        <TextField
          label="Template name"
          bind:value={name}
          placeholder="Gelu the pumped"
          error={name.length > 20 ? 'Keep it under 20 characters' : undefined}
        />
        <SelectField
          label="Hero class"
          value="ranger"
          options={[
            { value: 'knight', label: 'Knight' },
            { value: 'ranger', label: 'Ranger' },
            { value: 'planeswalker', label: 'Planeswalker', disabled: true },
          ]}
          hint="Classes from newer editions are disabled for older saves"
        />
      </div>
    </Fieldset>

    <Fieldset legend="Numbers">
      <div class="stack">
        <NumberField
          label="Experience"
          bind:value={experience}
          max={999999999}
          bigStep={1000}
          hint="ArrowUp/Down ±1, PageUp/Down ±1000"
        />
        <NumberField label="Attack" bind:value={attack} max={99} />
        <NumberField label="Gold" bind:value={gold} max={999999999} disabled />
        <p class="note">Experience: {experience}, attack: {attack}</p>
      </div>
    </Fieldset>

    <Fieldset legend="Choices">
      <div class="stack">
        <Checkbox label="Spell book" bind:checked={spellBook} hint="Without the book no spells" />
        <Checkbox label="Auto level" bind:checked={autoLevel} />
        <Checkbox label="Disabled" checked={false} disabled />
        <RadioGroup
          legend="Secondary skill level"
          bind:value={skillLevel}
          options={[
            { value: 'basic', label: 'Basic' },
            { value: 'advanced', label: 'Advanced' },
            { value: 'expert', label: 'Expert' },
          ]}
        />
        <RadioGroup
          legend="Quick load artifacts"
          direction="row"
          bind:value={artifactMode}
          options={[
            { value: 'add', label: 'Add' },
            { value: 'overwrite', label: 'Overwrite' },
          ]}
        />
      </div>
    </Fieldset>

    <Fieldset legend="Game data">
      <div class="stack">
        <SelectField
          label="Edition of the save"
          bind:value={edition}
          options={EDITIONS.map((option) => ({ value: option, label: editionName(option) }))}
        />
        <SelectField
          label="Game language for hero names"
          bind:value={gameLanguage}
          options={[
            { value: 'english', label: 'English game' },
            { value: 'russian', label: 'Russian game' },
          ]}
        />
        <Combobox label="Unit 1" items={creatures} bind:value={creature} />
        <Combobox label="Artifact" items={artifacts} bind:value={artifact} />
        <p class="note">Unit id: {creature ?? 'none'}, artifact id: {artifact ?? 'none'}</p>
      </div>
    </Fieldset>
  </div>

  <Fieldset legend="Dialogs and notifications">
    <div class="row">
      <Button variant="primary" onclick={() => (dialogOpen = true)}>Open dialog</Button>
      <Button onclick={() => showToast('The save file has been written to disk.')}>Info</Button>
      <Button onclick={() => showToast('Hero parameters changed.', { kind: 'success' })}>
        Success
      </Button>
      <Button
        onclick={() =>
          showToast('The save version is newer than selected; switched to In the Wake of Gods.', {
            kind: 'warning',
          })}>Warning</Button
      >
      <Button
        variant="danger"
        onclick={() => showToast('This file is not a Heroes 3 save.', { kind: 'error' })}
        >Error</Button
      >
    </div>
  </Fieldset>
</div>

<Dialog bind:open={dialogOpen} title="Load hero parameters" size="small">
  <div class="stack">
    <p>Pick a template and the sections to load.</p>
    <Checkbox label="Attributes" checked={true} />
    <Checkbox label="Units" checked={true} />
  </div>
  {#snippet footer()}
    <Button onclick={() => (dialogOpen = false)}>Cancel</Button>
    <Button variant="primary" onclick={() => (dialogOpen = false)}>Load</Button>
  {/snippet}
</Dialog>

<style>
  .showcase {
    display: grid;
    gap: var(--space-5);
  }

  h2 {
    font-size: 20px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  .stack {
    display: grid;
    gap: var(--space-3);
  }

  .icons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: var(--space-2);
  }

  .icon-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2);
    color: var(--color-heading);
  }

  .icon-cell small {
    color: var(--color-text-muted);
    font-size: 12px;
  }

  .note {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted);
  }
</style>
