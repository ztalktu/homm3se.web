<script lang="ts">
  import { session } from '../../../app/session.svelte';
  import type { Hero } from '../../../core/hero';
  import { isAvailableIn } from '../../../data/editions';
  import { SPELLS } from '../../../data/spells';
  import { spellName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import Button from '../../components/Button.svelte';
  import Checkbox from '../../components/Checkbox.svelte';

  interface Props {
    hero: Hero;
  }

  let { hero = $bindable() }: Props = $props();

  const available = $derived(
    SPELLS.filter((spell) => isAvailableIn(spell.introducedIn, session.edition)).map((s) => s.id),
  );

  function toggle(spellId: number, checked: boolean): void {
    const others = hero.spells.filter((id) => id !== spellId);
    hero.spells = (checked ? [...others, spellId] : others).sort((a, b) => a - b);
  }
</script>

<div class="top">
  <Checkbox
    label={t('heroDialog.spellBook')}
    hint={t('heroDialog.spellBookHint')}
    bind:checked={hero.hasSpellBook}
  />
  <div class="buttons">
    <Button
      size="small"
      disabled={!hero.hasSpellBook}
      onclick={() => (hero.spells = [...available])}
    >
      {t('heroDialog.allSpells')}
    </Button>
    <Button size="small" disabled={!hero.hasSpellBook} onclick={() => (hero.spells = [])}>
      {t('heroDialog.noSpells')}
    </Button>
  </div>
</div>

<div class="grid">
  {#each SPELLS as spell (spell.id)}
    <Checkbox
      label={spellName(spell.id)}
      checked={hero.spells.includes(spell.id)}
      disabled={!hero.hasSpellBook || !available.includes(spell.id)}
      onchange={(checked) => toggle(spell.id, checked)}
    />
  {/each}
</div>

<style>
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .buttons {
    display: flex;
    gap: var(--space-2);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 0 var(--space-3);
  }
</style>
