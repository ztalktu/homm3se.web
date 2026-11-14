<script lang="ts">
  /**
   * The "Changed" block of the info page: resources and heroes, before → after. Once the file has
   * been written, a tick marks what it already holds, and the rest stands out with a star.
   */
  import { changeSummary, session } from '../../app/session.svelte';
  import type { HeroAttribute, ListChange } from '../../core/changes';
  import type { Troop } from '../../core/hero';
  import type { SkillLevel } from '../../data/skills';
  import {
    artifactName,
    creatureName,
    heroClassName,
    playerLabel,
    skillLevelName,
    skillName,
    spellName,
  } from '../../i18n/game.svelte';
  import { t, type MessageKey } from '../../i18n/index.svelte';
  import Icon from '../components/Icon.svelte';
  import PlayerFlag from '../components/PlayerFlag.svelte';
  import type { IconName } from '../components/icons';
  import { formatDelta, formatNumber } from '../format';

  const summary = $derived(changeSummary());
  // Ticks and stars only make sense once there is a written file to compare with.
  const marked = $derived(session.savedAs !== null);

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

  /** Numbers that get a "+N" / "−N" after them: everything but the name and the class. */
  const counted = (attribute: HeroAttribute): boolean =>
    attribute !== 'name' && attribute !== 'classId';

  function attributeValue(attribute: HeroAttribute, value: string | number): string {
    if (typeof value === 'string') {
      return value;
    }
    return attribute === 'classId' ? heroClassName(value) : formatNumber(value);
  }

  const troopText = (troop: Troop | null): string =>
    troop
      ? `${creatureName(troop.creatureId)} × ${formatNumber(troop.count)}`
      : t('hero.emptySlot');

  const skillText = (level: SkillLevel | null): string =>
    level === null ? t('heroDialog.noSkill') : skillLevelName(level);
</script>

{#snippet mark(saved: boolean)}
  {#if marked}
    {#if saved}
      <span class="mark saved" title={t('info.savedMark')}>✓</span>
    {:else}
      <span class="mark unsaved" title={t('info.unsavedMark')}>*</span>
    {/if}
  {/if}
{/snippet}

{#snippet arrow()}
  <span class="arrow" aria-hidden="true">»</span><span class="visually-hidden">→</span>
{/snippet}

{#snippet delta(before: number, after: number)}
  <span class:up={after > before} class:down={after < before}>{formatDelta(after - before)}</span>
{/snippet}

{#snippet chips(changes: ListChange[], name: (id: number) => string)}
  {#each changes as change (change.id)}
    {@render chip(change.added, change.saved, name(change.id), change.count)}
  {/each}
{/snippet}

{#snippet chip(added: boolean, saved: boolean, label: string, count = 1)}
  <span class="chip" class:added class:removed={!added} class:unsaved={marked && !saved}>
    {@render mark(saved)}<span class="sign">{added ? '+' : '−'}</span><span class="chip-label"
      >{label}{count > 1 ? ` × ${count}` : ''}</span
    >
  </span>
{/snippet}

{#snippet group(icon: IconName, title: string)}
  <h5><Icon name={icon} size={16} />{title}</h5>
{/snippet}

{#if summary.treasuries.length === 0 && summary.heroes.length === 0}
  <p class="empty">{t('info.noChanges')}</p>
{:else}
  {#if marked}
    <p class="legend">
      <span><span class="mark saved">✓</span>{t('info.savedMark')}</span>
      <span class="unsaved"><span class="mark">*</span>{t('info.unsavedMark')}</span>
    </p>
  {/if}

  {#if summary.treasuries.length > 0}
    <section>
      <h3><Icon name="chest" />{t('info.changedResources')}</h3>
      {#each summary.treasuries as treasury, index (index)}
        <!-- Always named, even when only one treasury changed: the reader should not guess whose. -->
        {#if treasury.color}
          <h4 class="player"><PlayerFlag color={treasury.color} />{playerLabel(treasury.color)}</h4>
        {/if}
        <ul class="resources">
          {#each treasury.resources as change (change.resource)}
            <li class:unsaved={marked && !change.saved}>
              <!-- A cell of its own even without a mark, so the columns stay in place. -->
              <span>{@render mark(change.saved)}</span>
              <span class="label">{t(`resource.${change.resource}`)}:</span>
              <span class="number">{formatNumber(change.before)}</span>
              {@render arrow()}
              <span class="number">{formatNumber(change.after)}</span>
              <span class="pill">{@render delta(change.before, change.after)}</span>
            </li>
          {/each}
        </ul>
      {/each}
    </section>
  {/if}

  {#if summary.heroes.length > 0}
    <section>
      <h3><Icon name="hero" />{t('info.changedHeroes')}</h3>
      <div class="heroes">
        {#each summary.heroes as hero, index (index)}
          {@const changes = hero.changes}
          <article>
            <header>
              <Icon name="hero" />
              <h4>{hero.name}</h4>
              <span class="subtitle">{heroClassName(hero.classId)} · {playerLabel(hero.owner)}</span
              >
            </header>

            {#if changes.attributes.length > 0}
              {@render group('attributes', t('heroDialog.tab.attributes'))}
              <ul>
                {#each changes.attributes as change (change.attribute)}
                  <li class:unsaved={marked && !change.saved}>
                    {@render mark(change.saved)}{t(ATTRIBUTE_LABELS[change.attribute])}:
                    {attributeValue(
                      change.attribute,
                      change.before,
                    )}{@render arrow()}{attributeValue(change.attribute, change.after)}
                    {#if counted(change.attribute)}
                      ({@render delta(Number(change.before), Number(change.after))})
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}

            {#if changes.troops.length > 0}
              {@render group('troops', t('heroDialog.tab.troops'))}
              <ul>
                {#each changes.troops as change (change.slot)}
                  {@const { before, after } = change}
                  <li class:unsaved={marked && !change.saved}>
                    {@render mark(change.saved)}{t('heroDialog.slot', { slot: change.slot + 1 })}:
                    {#if before && after && before.creatureId === after.creatureId}
                      {creatureName(after.creatureId)}: {formatNumber(
                        before.count,
                      )}{@render arrow()}{formatNumber(after.count)}
                      ({@render delta(before.count, after.count)})
                    {:else}
                      {troopText(before)}{@render arrow()}{troopText(after)}
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}

            {#if changes.skills.length > 0}
              {@render group('skills', t('heroDialog.tab.skills'))}
              <ul>
                {#each changes.skills as change (change.skillId)}
                  <li class:unsaved={marked && !change.saved}>
                    {@render mark(change.saved)}{skillName(change.skillId)}:
                    {skillText(change.before)}{@render arrow()}{skillText(change.after)}
                  </li>
                {/each}
              </ul>
            {/if}

            {#if changes.artifacts.length > 0}
              {@render group('chest', t('heroDialog.tab.artifacts'))}
              <div class="chips">{@render chips(changes.artifacts, artifactName)}</div>
            {/if}

            {#if changes.spellBook || changes.spells.length > 0}
              {@render group('spells', t('heroDialog.tab.spells'))}
              <div class="chips">
                {#if changes.spellBook}
                  {@render chip(
                    changes.spellBook.after,
                    changes.spellBook.saved,
                    t('heroDialog.spellBook'),
                  )}
                {/if}
                {@render chips(changes.spells, spellName)}
              </div>
            {/if}
          </article>
        {/each}
      </div>
    </section>
  {/if}
{/if}

<style>
  .empty {
    margin: var(--space-2) 0 0;
    color: var(--color-text-muted);
  }

  section + section {
    margin-top: var(--space-5);
  }

  h3 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: var(--space-1) 0 var(--space-2);
    font-size: 16px;
  }

  h4 {
    margin: 0;
    font-family: var(--font-heading);
    font-weight: 500;
    font-size: 15px;
    color: var(--color-heading);
  }

  section > h4 {
    margin: var(--space-2) 0 var(--space-1);
  }

  .player {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  h5 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: var(--space-2) 0 2px;
    font-size: 13px;
    font-weight: 400;
    color: var(--color-label);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    padding: 1px var(--space-1);
    border-radius: var(--radius-small);
  }

  .arrow {
    padding: 0 6px;
    font-size: 1.15em;
    font-weight: 700;
    line-height: 1;
    color: var(--color-heading);
  }

  .up {
    color: var(--color-increase);
  }

  .down {
    color: var(--color-decrease);
  }

  /* Tick for what the written file holds, star and a golden backing for what it does not. */
  .mark {
    display: inline-block;
    font-weight: 700;
  }

  /* In a row the mark keeps a column of its own, so the texts line up. */
  li > .mark {
    width: 1.3em;
  }

  .mark.saved {
    color: var(--color-increase);
  }

  .mark.unsaved {
    color: var(--color-unsaved);
  }

  li.unsaved {
    background: var(--color-unsaved-soft);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-1) var(--space-4);
    margin: 0 0 var(--space-1);
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .legend .mark {
    margin-right: var(--space-1);
  }

  .legend .unsaved {
    padding: 0 var(--space-1);
    border-radius: var(--radius-small);
    background: var(--color-unsaved-soft);
  }

  .legend .unsaved .mark {
    color: var(--color-unsaved);
  }

  /* Resources: a grid of rows, each with its own columns so the numbers line up. */
  .resources {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 6px 48px;
  }

  .resources li {
    display: grid;
    grid-template-columns: 1.3em 92px 52px 22px 52px auto;
    align-items: baseline;
  }

  .resources .label {
    font-size: 13px;
    color: var(--color-label);
  }

  .resources .number {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .resources .arrow {
    padding: 0;
    text-align: center;
  }

  .pill {
    justify-self: start;
    margin-left: 10px;
    padding: 0 6px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
  }

  .pill:has(.up) {
    background: color-mix(in srgb, var(--color-increase) 18%, transparent);
  }

  .pill:has(.down) {
    background: color-mix(in srgb, var(--color-decrease) 18%, transparent);
  }

  /* Heroes: one card each. */
  .heroes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: var(--space-4);
  }

  article {
    min-width: 0;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-frame-soft);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--color-page) 25%, transparent);
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .subtitle {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  /* Artifacts and spells: chips in the spell list colours, unsaved ones in a golden frame. */
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
    padding-left: var(--space-4);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 1px var(--space-2);
    border: 1px solid;
    border-radius: 12px;
    font-size: 13px;
  }

  .chip.added {
    border-color: var(--color-spell-added);
    background: color-mix(in srgb, var(--color-spell-added) 14%, transparent);
    color: var(--color-added-text);
  }

  .chip.removed {
    border-color: var(--color-spell-removed);
    background: var(--color-spell-removed-soft);
    color: var(--color-removed-text);
  }

  .chip.removed .chip-label {
    text-decoration: line-through;
    text-decoration-thickness: 1px;
  }

  .chip.unsaved {
    outline: 1px solid var(--color-unsaved);
    outline-offset: 2px;
  }

  .chip .mark {
    margin-right: 2px;
  }

  .sign {
    margin-right: var(--space-1);
    font-weight: 700;
  }

  @media (max-width: 420px) {
    .resources,
    .heroes {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
