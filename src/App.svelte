<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';
  import { SAVE_FILE_EXTENSIONS } from './app/fileAccess';
  import {
    preferences,
    resolveTheme,
    setLocale,
    setThemePreference,
    THEME_PREFERENCES,
  } from './app/preferences.svelte';
  import {
    hasUnsavedChanges,
    openSaveFile,
    saveCurrent,
    session,
    setEdition,
  } from './app/session.svelte';
  import { APP_VERSION } from './app/version';
  import { agreeToWelcome, hasAgreedToWelcome } from './app/welcome';
  import { EDITIONS } from './data/editions';
  import { editionName } from './i18n/game.svelte';
  import { t } from './i18n/index.svelte';
  import { tooltip } from './ui/actions/tooltip';
  import HeaderSelect from './ui/components/HeaderSelect.svelte';
  import Icon from './ui/components/Icon.svelte';
  import Tabs from './ui/components/Tabs.svelte';
  import Toaster from './ui/components/Toaster.svelte';
  import { formatSize, languageOptions } from './ui/format';
  import HeroEditorTab from './ui/screens/HeroEditorTab.svelte';
  import HistoryDialog from './ui/screens/HistoryDialog.svelte';
  import InfoTab from './ui/screens/InfoTab.svelte';
  import ResourceEditorTab from './ui/screens/ResourceEditorTab.svelte';
  import UnsavedDialog from './ui/screens/UnsavedDialog.svelte';
  import WelcomeDialog from './ui/screens/WelcomeDialog.svelte';

  type TabId = 'info' | 'heroEditor' | 'resourceEditor';

  const REPOSITORY_URL = 'https://github.com/ztalktu/homm3se.web';
  const CURRENT_YEAR = new Date().getFullYear();

  const systemDark = new MediaQuery('(prefers-color-scheme: dark)');
  let activeTab: TabId = $state('info');
  let historyOpen = $state(false);
  let welcomeOpen = $state(!hasAgreedToWelcome());
  let unsavedOpen = $state(false);
  let pendingFile: File | null = $state(null);
  let dragging = $state(false);
  let fileInput: HTMLInputElement | undefined = $state();

  // Development aid: #showcase renders the component showcase instead of the editor.
  const showcaseAvailable = import.meta.env.DEV;
  let showcaseRequested = $state(showcaseAvailable && location.hash === '#showcase');

  const theme = $derived(resolveTheme(preferences.theme, systemDark.current));
  const unsaved = $derived(hasUnsavedChanges());
  // Edits keep the same SaveGame, so a new reference means a newly opened file.
  const save = $derived(session.save);

  const tabs = $derived([
    { id: 'info' as const, label: t('tabs.info') },
    { id: 'heroEditor' as const, label: t('tabs.heroEditor') },
    { id: 'resourceEditor' as const, label: t('tabs.resourceEditor') },
  ]);

  const editionOptions = $derived(
    EDITIONS.map((edition) => ({ value: edition, label: editionName(edition) })),
  );

  function chooseFile(): void {
    fileInput?.click();
  }

  async function open(file: File): Promise<void> {
    if (hasUnsavedChanges()) {
      pendingFile = file;
      unsavedOpen = true;
      return;
    }
    await openFile(file);
  }

  /** Opens the file and, from the info page, goes straight to the hero editor. */
  async function openFile(file: File): Promise<void> {
    await openSaveFile(file);
    if (activeTab === 'info' && session.save) {
      activeTab = 'heroEditor';
    }
  }

  async function onFileChosen(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      await open(file);
    }
  }

  async function resolvePending(saveFirst: boolean): Promise<void> {
    const file = pendingFile;
    if (saveFirst && !(await saveCurrent())) {
      return;
    }
    unsavedOpen = false;
    pendingFile = null;
    if (file) {
      await openFile(file);
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'o') {
      event.preventDefault();
      chooseFile();
    } else if (key === 's' && session.save) {
      event.preventDefault();
      void saveCurrent();
    }
  }

  function onDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      dragging = true;
    }
  }

  async function onDrop(event: DragEvent): Promise<void> {
    dragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      event.preventDefault();
      await open(file);
    }
  }

  function onBeforeUnload(event: BeforeUnloadEvent): void {
    if (hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  $effect(() => {
    document.documentElement.dataset['theme'] = theme;
  });

  $effect(() => {
    document.documentElement.lang = preferences.locale;
  });

  $effect(() => {
    document.title = save
      ? `${save.fileName}${unsaved ? ' *' : ''} · ${t('app.title')}`
      : t('app.title');
  });
</script>

<svelte:window
  onkeydown={onKeydown}
  ondragover={onDragOver}
  ondragleave={(event) => event.relatedTarget === null && (dragging = false)}
  ondrop={onDrop}
  onbeforeunload={onBeforeUnload}
  onhashchange={() => (showcaseRequested = showcaseAvailable && location.hash === '#showcase')}
/>

<input
  bind:this={fileInput}
  class="visually-hidden"
  type="file"
  accept={SAVE_FILE_EXTENSIONS.join(',')}
  tabindex="-1"
  aria-hidden="true"
  onchange={onFileChosen}
/>

<div class="app">
  <header class="app-header">
    <div class="brand">
      <h1>
        <img class="emblem" src="./favicon.svg" alt="" width="30" height="30" />
        <span>{t('app.title')}</span>
      </h1>
      <button
        type="button"
        class="version"
        onclick={() => (historyOpen = true)}
        aria-label={t('app.version', { version: APP_VERSION })}
        use:tooltip={t('app.versionHint')}
      >
        <span class="version-long">{t('app.version', { version: APP_VERSION })}</span>
        <span class="version-short">{APP_VERSION}</span>
      </button>
    </div>

    <div class="header-controls">
      <HeaderSelect
        label={t('toolbar.language')}
        hint={t('toolbar.languageHint')}
        value={preferences.locale}
        options={languageOptions()}
        onchange={setLocale}
      />
      <HeaderSelect
        label={t('toolbar.theme')}
        hint={t('toolbar.themeHint')}
        value={preferences.theme}
        options={THEME_PREFERENCES.map((option) => ({
          value: option,
          label: t(`theme.${option}`),
        }))}
        onchange={setThemePreference}
      />
    </div>

    <div class="toolbar">
      <button type="button" class="tool" onclick={chooseFile} use:tooltip={t('toolbar.openHint')}>
        <Icon name="open" />
        <span>{t('toolbar.open')}</span>
      </button>
      <button
        type="button"
        class="tool"
        disabled={!session.save}
        onclick={() => void saveCurrent()}
        use:tooltip={t('toolbar.saveHint')}
      >
        <Icon name="save" />
        <span>{t('toolbar.save')}</span>
      </button>
      <HeaderSelect
        label={t('toolbar.edition')}
        hint={t('toolbar.editionHint')}
        value={session.edition}
        options={editionOptions}
        onchange={setEdition}
      />
    </div>
  </header>

  <main>
    {#if showcaseAvailable && showcaseRequested}
      {#await import('./ui/screens/Showcase.svelte') then { default: Showcase }}
        <Showcase />
      {/await}
    {:else}
      <Tabs items={tabs} bind:active={activeTab} label={t('tabs.label')} />
      <div
        class="panel"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabindex="-1"
      >
        {#if activeTab === 'info'}
          <InfoTab onopen={chooseFile} />
        {:else if activeTab === 'heroEditor'}
          <HeroEditorTab />
        {:else}
          <ResourceEditorTab />
        {/if}
      </div>
    {/if}
    <p class="credits">
      {t('credits.author', { year: CURRENT_YEAR })} · {t('credits.openProject')}
      <a href={`${REPOSITORY_URL}/blob/main/LICENSE`} target="_blank" rel="noopener"
        >{t('credits.license')}</a
      >
      · <a href={REPOSITORY_URL} target="_blank" rel="noopener">{t('credits.github')}</a>
    </p>
  </main>

  <footer class="status-bar">
    {#if save}
      <span
        >{t('status.opened', { file: save.fileName, size: formatSize(save.buffer.length) })}</span
      >
      <span class:unsaved>{unsaved ? t('status.unsaved') : t('status.saved')}</span>
    {:else}
      <span>{t('status.noFile')}</span>
    {/if}
  </footer>
</div>

{#if dragging}
  <div class="drop-overlay" aria-hidden="true">
    <Icon name="upload" size={40} />
    <span>{t('toolbar.dropHere')}</span>
  </div>
{/if}

<HistoryDialog bind:open={historyOpen} />
<WelcomeDialog
  bind:open={welcomeOpen}
  onagree={() => {
    agreeToWelcome();
    welcomeOpen = false;
  }}
/>
<UnsavedDialog
  bind:open={unsavedOpen}
  onsave={() => void resolvePending(true)}
  ondiscard={() => void resolvePending(false)}
/>
<Toaster />

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* One row on wide screens; on narrow ones the title keeps language and theme beside it
     and the file tools move to a second row. Base rules come first so the media queries
     below can override them. */
  .app-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas: 'brand tools prefs';
    align-items: center;
    gap: var(--space-3) var(--space-5);
    padding: var(--space-3) var(--space-4);
    background: var(--color-header);
    border-bottom: 2px solid var(--color-frame);
  }

  .brand {
    grid-area: brand;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-3);
    min-width: 0;
  }

  h1 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 22px;
    color: var(--color-header-text);
  }

  .emblem {
    flex: none;
    width: 1.35em;
    height: 1.35em;
  }

  .version {
    padding: 2px var(--space-2);
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-small);
    background: transparent;
    color: var(--color-header-text);
    font-size: 13px;
    cursor: pointer;
  }

  .version:hover {
    background: var(--color-frame);
    color: var(--color-header);
  }

  .version-short {
    display: none;
  }

  /* Each group stays on one line: when they do not fit, the header gets a second row. */
  .toolbar,
  .header-controls {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
  }

  .toolbar {
    grid-area: tools;
  }

  .header-controls {
    grid-area: prefs;
    justify-self: end;
  }

  .tool {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    height: 30px;
    padding: 0 var(--space-3);
    border: 1px solid var(--color-header-control-border);
    border-radius: var(--radius-small);
    background: var(--color-header-control);
    color: var(--color-header-text);
    font-size: 14px;
    cursor: pointer;
  }

  .tool:hover:not(:disabled) {
    background: var(--color-header-control-hover);
    border-color: var(--color-frame);
  }

  .tool:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 1440px) {
    .app-header {
      /* The title may wrap between words, but never gets narrower than a word. */
      grid-template-columns: minmax(min-content, 1fr) auto;
      grid-template-areas:
        'brand prefs'
        'tools tools';
    }
  }

  /* Phones: the title stays on one line with language and theme, the file tools
     show only icons, and the version button shrinks to the number. */
  @media (max-width: 820px) {
    .app-header {
      grid-template-areas:
        'title prefs'
        'tools tools';
      gap: var(--space-3) var(--space-2);
      padding: var(--space-2) var(--space-3);
    }

    .brand {
      display: contents;
    }

    /* On the narrowest phones the title breaks between words rather than pushing
       language and theme off its line. */
    h1 {
      grid-area: title;
      font-size: 16px;
      line-height: 1.15;
    }

    .toolbar,
    .header-controls {
      gap: var(--space-2);
    }

    /* The toolbar shares the cell with the version button: keep it to its own width
       so it does not cover the button. */
    .toolbar {
      justify-self: start;
      min-width: 0;
    }

    .tool {
      padding: 0 var(--space-2);
    }

    /* File tools show only their icons and the selects show their value; the hints and
       the hidden labels still name them for screen readers. */
    .tool span,
    .toolbar :global(label),
    .header-controls :global(label) {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    /* A native select is as wide as its longest option ("HD Edition (test drive)"). */
    .toolbar :global(select) {
      max-width: calc(100vw - 180px);
      padding-left: var(--space-2);
      font-size: 13px;
      text-overflow: ellipsis;
    }

    .header-controls :global(select) {
      height: 28px;
      padding: 0 22px 0 var(--space-2);
      font-size: 13px;
    }

    .header-controls {
      --header-select-chevron-right: 8px;
    }

    /* Shares the second row with the file tools, pinned to its right end. */
    .version {
      grid-area: tools;
      justify-self: end;
      height: 30px;
    }

    .version-long {
      display: none;
    }

    .version-short {
      display: inline;
    }
  }

  /* The narrowest phones (320–400px): the emblem goes so the title, language and theme
     still fit on one line without scrolling sideways. */
  @media (max-width: 400px) {
    .emblem {
      display: none;
    }

    h1 {
      font-size: 15px;
    }
  }

  main {
    flex: 1;
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: var(--space-5) var(--space-4) var(--space-4);
  }

  .panel {
    min-height: 360px;
    padding: var(--space-5);
    background: var(--color-panel);
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-large);
  }

  .credits {
    margin: var(--space-3) 0 0;
    text-align: right;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .credits a {
    color: inherit;
  }

  .credits a:hover {
    color: var(--color-heading);
  }

  .status-bar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-2) var(--space-4);
    padding: var(--space-2) var(--space-4);
    background: var(--color-header);
    border-top: 1px solid var(--color-frame);
    color: var(--color-header-text);
    font-size: 13px;
  }

  .status-bar .unsaved {
    font-weight: 600;
  }

  .drop-overlay {
    position: fixed;
    inset: var(--space-4);
    z-index: 800;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    border: 3px dashed var(--color-frame);
    border-radius: var(--radius-large);
    background: var(--color-overlay);
    color: var(--color-header-text);
    font-family: var(--font-heading);
    font-size: 24px;
    pointer-events: none;
  }
</style>
