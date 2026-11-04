<script lang="ts">
  import { tick } from 'svelte';
  import { preferences } from '../../app/preferences.svelte';
  import {
    histories,
    legacyHistories,
    type ChangeKind,
    type HistoryRelease,
  } from '../../i18n/history';
  import { t, type MessageKey } from '../../i18n/index.svelte';
  import { tooltip } from '../actions/tooltip';
  import Dialog from '../components/Dialog.svelte';

  interface Props {
    open: boolean;
  }

  let { open = $bindable() }: Props = $props();

  let content: HTMLDivElement | undefined = $state();
  let legacyHeading: HTMLHeadingElement | undefined = $state();
  let showLegacy = $state(false);

  /** The same markers the 2001–2005 history used. */
  const MARKERS: Record<ChangeKind, string> = {
    major: '!',
    added: '+',
    changed: '*',
    fixed: '−',
    removed: 'd',
  };

  const KIND_LABELS: Record<ChangeKind, MessageKey> = {
    major: 'history.kind.major',
    added: 'history.kind.added',
    changed: 'history.kind.changed',
    fixed: 'history.kind.fixed',
    removed: 'history.kind.removed',
  };

  const releases = $derived(histories[preferences.locale]);
  const legacyReleases = $derived(legacyHistories[preferences.locale]);

  async function toggleLegacy(): Promise<void> {
    showLegacy = !showLegacy;
    if (!showLegacy) {
      return;
    }
    await tick();
    if (!content || !legacyHeading) {
      return;
    }
    // Scroll only the content area: scrollIntoView would also shift the dialog with its header.
    const offset = legacyHeading.getBoundingClientRect().top - content.getBoundingClientRect().top;
    content.scrollTo({ top: content.scrollTop + offset - 16, behavior: 'smooth' });
  }

  function formatDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString(preferences.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
</script>

{#snippet releaseView(release: HistoryRelease)}
  <section class="release">
    <h3>
      {t('app.version', { version: release.version })}
      <span class="date"
        >{release.date ? formatDate(release.date) : t('history.inDevelopment')}</span
      >
    </h3>
    {#if release.summary}
      <p class="summary">{release.summary}</p>
    {/if}
    <ul>
      {#each release.changes as change, index (index)}
        <li>
          <span class="marker" data-kind={change.kind} use:tooltip={t(KIND_LABELS[change.kind])}>
            <span aria-hidden="true">{MARKERS[change.kind]}</span>
            <span class="visually-hidden">{t(KIND_LABELS[change.kind])}:</span>
          </span>
          <span class="change">
            {change.text}
            {#if change.credit}
              <span class="credit">{t('history.credit', { name: change.credit })}</span>
            {/if}
          </span>
        </li>
      {/each}
    </ul>
  </section>
{/snippet}

<Dialog bind:open bind:contentElement={content} title={t('history.title')}>
  <div class="stack">
    {#each releases as release (release.version)}
      {@render releaseView(release)}
    {/each}

    {#if showLegacy}
      <div id="legacy-history" class="stack legacy">
        <h3 class="legacy-title" bind:this={legacyHeading}>{t('history.legacyTitle')}</h3>
        {#each legacyReleases as release (release.version)}
          {@render releaseView(release)}
        {/each}
      </div>
    {/if}

    <div class="legacy-toggle">
      <button
        type="button"
        aria-expanded={showLegacy}
        aria-controls="legacy-history"
        onclick={toggleLegacy}
        use:tooltip={t('history.previouslyHint')}
      >
        {showLegacy ? t('history.previouslyHide') : t('history.previously')}
      </button>
    </div>
  </div>
</Dialog>

<style>
  .stack {
    display: grid;
    gap: var(--space-5);
  }

  .legacy {
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-frame-soft);
  }

  .legacy-title {
    font-size: 17px;
  }

  h3 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-3);
    font-size: 16px;
  }

  .date {
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .summary {
    margin: var(--space-2) 0 0;
    font-style: italic;
  }

  ul {
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: var(--space-2);
  }

  li {
    display: grid;
    grid-template-columns: 24px 1fr;
    gap: var(--space-2);
    align-items: start;
  }

  .change {
    white-space: pre-line;
  }

  .credit {
    display: block;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    margin-top: 1px;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-small);
    font-weight: 600;
    font-size: 13px;
    color: var(--color-heading);
  }

  .marker[data-kind='major'] {
    background: var(--color-primary);
    color: var(--color-primary-text);
  }

  .legacy-toggle {
    display: flex;
    justify-content: center;
  }

  .legacy-toggle button {
    padding: var(--space-2) var(--space-5);
    border: 1px solid var(--color-frame);
    border-radius: var(--radius);
    background: transparent;
    color: var(--color-heading);
    font-family: var(--font-heading);
    font-size: 15px;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .legacy-toggle button:hover {
    background: var(--color-secondary-hover);
  }
</style>
