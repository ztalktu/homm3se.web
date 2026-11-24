<script lang="ts" generics="TabId extends string">
  /**
   * The window of an editor (a hero, a town): tabs over a scrolling panel, the problems that keep
   * "Apply" from going through, Cancel and Apply, and a question about changes not yet applied
   * when the window is closed another way.
   */
  import type { Snippet } from 'svelte';
  import { t } from '../../i18n/index.svelte';
  import UnsavedDialog from '../screens/UnsavedDialog.svelte';
  import Button from './Button.svelte';
  import Dialog from './Dialog.svelte';
  import Tabs from './Tabs.svelte';

  interface Props {
    open: boolean;
    title: string;
    tabs: { id: TabId; label: string }[];
    active: TabId;
    tabsLabel: string;
    /** The draft differs from what was opened: closing asks first. */
    changed: boolean;
    /** Problems found by the last "Apply"; shown over the buttons. */
    problems: string[];
    /** Text of the question about changes not applied. */
    unsavedText: string;
    onapply: () => void;
    size?: 'large' | 'wide' | undefined;
    /** The panel of the active tab. */
    children: Snippet;
    /** Buttons at the start of the footer, before Cancel and Apply (the presets). */
    actions?: Snippet | undefined;
  }

  let {
    open = $bindable(),
    title,
    tabs,
    active = $bindable(),
    tabsLabel,
    changed,
    problems,
    unsavedText,
    onapply,
    size = 'large',
    children,
    actions,
  }: Props = $props();

  let askToApply = $state(false);

  /** Escape, the backdrop or the close button with changes made: ask before losing them. */
  function canClose(): boolean {
    if (changed) {
      askToApply = true;
      return false;
    }
    return true;
  }

  function applyFromQuestion(): void {
    askToApply = false;
    // A problem keeps the window open and lists it, as with the Apply button.
    onapply();
  }

  function discard(): void {
    askToApply = false;
    open = false;
  }
</script>

<Dialog bind:open {title} {size} scrollable={false} {canClose}>
  <div class="body">
    <Tabs items={tabs} bind:active label={tabsLabel} />
    <div
      class="panel"
      role="tabpanel"
      id={`panel-${active}`}
      aria-labelledby={`tab-${active}`}
      tabindex="-1"
    >
      {@render children()}
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
    {#if actions}
      <div class="actions">{@render actions()}</div>
    {/if}
    <Button onclick={() => (open = false)}>{t('common.cancel')}</Button>
    <Button variant="primary" icon="check" onclick={onapply}>{t('editor.apply')}</Button>
  {/snippet}
</Dialog>

<UnsavedDialog
  bind:open={askToApply}
  text={unsavedText}
  saveLabel={t('editor.apply')}
  discardLabel={t('editor.dontApply')}
  onsave={applyFromQuestion}
  ondiscard={discard}
/>

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

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-right: auto;
  }

  .problems ul {
    margin: var(--space-1) 0 0;
    padding-left: var(--space-4);
  }
</style>
