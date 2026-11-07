<script lang="ts">
  import { applyHero, session } from '../../app/session.svelte';
  import { encodeHeroName, type Hero } from '../../core/hero';
  import { validateHero, type HeroProblem } from '../../core/rules';
  import { artifactName, spellName } from '../../i18n/game.svelte';
  import { t } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Dialog from '../components/Dialog.svelte';
  import Tabs from '../components/Tabs.svelte';
  import HeroAttributesTab from './hero/HeroAttributesTab.svelte';
  import HeroBackpackTab from './hero/HeroBackpackTab.svelte';
  import HeroSkillsTab from './hero/HeroSkillsTab.svelte';
  import HeroSpellsTab from './hero/HeroSpellsTab.svelte';
  import HeroTroopsTab from './hero/HeroTroopsTab.svelte';

  interface Props {
    open: boolean;
    /** The hero as read from the save; the dialog edits a copy. */
    original: Hero;
  }

  let { open = $bindable(), original }: Props = $props();

  type TabId = 'attributes' | 'troops' | 'skills' | 'artifacts' | 'spells';

  // A draft: nothing reaches the save until "Apply".
  // svelte-ignore state_referenced_locally
  let hero: Hero = $state(structuredClone($state.snapshot(original)));
  let activeTab: TabId = $state('attributes');
  let problems: string[] = $state([]);

  const tabs = $derived([
    { id: 'attributes' as const, label: t('heroDialog.tab.attributes') },
    { id: 'troops' as const, label: t('heroDialog.tab.troops') },
    { id: 'skills' as const, label: t('heroDialog.tab.skills') },
    { id: 'artifacts' as const, label: t('heroDialog.tab.artifacts') },
    { id: 'spells' as const, label: t('heroDialog.tab.spells') },
  ]);

  const nameError = $derived.by(() => {
    if (hero.name.trim() === '') {
      return t('problem.nameEmpty');
    }
    try {
      encodeHeroName(hero.name, session.heroMatch?.codePage ?? 'windows-1252');
      return undefined;
    } catch {
      return t('problem.nameInvalid');
    }
  });

  function describe(problem: HeroProblem): string {
    switch (problem.code) {
      case 'troopCountZero':
        return t('problem.troopCountZero', { slot: problem.slot + 1 });
      case 'creatureNotAllowed':
        return t('problem.creatureNotAllowed', { slot: problem.slot + 1 });
      case 'artifactNotAllowed':
        return t('problem.artifactNotAllowed', { name: artifactName(problem.artifactId) });
      case 'spellNotInEdition':
        return t('problem.spellNotInEdition', { name: spellName(problem.spellId) });
      default:
        return t(`problem.${problem.code}`);
    }
  }

  function apply(): void {
    const found = validateHero(hero, session.edition)
      .filter((problem) => problem.code !== 'nameEmpty')
      .map(describe);
    if (nameError) {
      found.unshift(nameError);
    }
    problems = [...new Set(found)];
    if (problems.length > 0) {
      return;
    }
    applyHero($state.snapshot(hero));
    open = false;
  }
</script>

<Dialog
  bind:open
  title={t('heroDialog.title', { name: original.name })}
  size="large"
  scrollable={false}
>
  <div class="body">
    <Tabs items={tabs} bind:active={activeTab} label={t('heroDialog.tabs')} />
    <div
      class="panel"
      role="tabpanel"
      id={`panel-${activeTab}`}
      aria-labelledby={`tab-${activeTab}`}
      tabindex="-1"
    >
      {#if activeTab === 'attributes'}
        <HeroAttributesTab bind:hero {nameError} />
      {:else if activeTab === 'troops'}
        <HeroTroopsTab bind:hero />
      {:else if activeTab === 'skills'}
        <HeroSkillsTab bind:hero />
      {:else if activeTab === 'artifacts'}
        <HeroBackpackTab bind:hero />
      {:else}
        <HeroSpellsTab bind:hero />
      {/if}
    </div>
  </div>

  {#snippet footer()}
    {#if problems.length > 0}
      <div class="problems" role="alert">
        <strong>{t('problem.title')}</strong>
        <ul>
          {#each problems as problem (problem)}
            <li>{problem}</li>
          {/each}
        </ul>
      </div>
    {/if}
    <Button onclick={() => (open = false)}>{t('heroDialog.cancel')}</Button>
    <Button variant="primary" icon="check" onclick={apply}>{t('heroDialog.ok')}</Button>
  {/snippet}
</Dialog>

<style>
  .body {
    --tabs-inset: 0;
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }

  /* Only the panel scrolls, so the tabs stay in sight. */
  .panel {
    min-height: min(360px, 40vh);
    overflow-y: auto;
    padding: var(--space-4);
    border: 1px solid var(--color-frame);
    border-radius: 0 var(--radius) var(--radius) var(--radius);
    background: var(--color-panel);
  }

  .problems {
    flex-basis: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-danger);
    border-radius: var(--radius-small);
    color: var(--color-error-text);
    font-size: 13px;
  }

  .problems ul {
    margin: var(--space-1) 0 0;
    padding-left: var(--space-4);
  }
</style>
