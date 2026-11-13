<script lang="ts">
  /**
   * Modal window on top of the native <dialog>: focus trapping, Escape and the backdrop
   * come from the browser. The header stays in place, only the content scrolls.
   */
  import type { Snippet } from 'svelte';
  import { t } from '../../i18n/index.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    title: string;
    size?: 'small' | 'medium' | 'large' | undefined;
    /** False: no close button, Escape and backdrop clicks do nothing; only an action closes it. */
    dismissible?: boolean | undefined;
    /** The scrolling content area, for callers that need to scroll it themselves. */
    contentElement?: HTMLDivElement | undefined;
    /**
     * False: the content area does not scroll and lays its child out as a column that fills
     * the available height, so the caller can scroll a part of it (a tab panel, say).
     */
    scrollable?: boolean | undefined;
    /**
     * Asked before the user closes it with Escape, the backdrop or the close button:
     * false keeps it open (to ask about unsaved changes first, say).
     */
    canClose?: (() => boolean) | undefined;
    onclose?: (() => void) | undefined;
    children: Snippet;
    footer?: Snippet | undefined;
  }

  let {
    open = $bindable(),
    title,
    size = 'medium',
    dismissible = true,
    contentElement = $bindable(),
    scrollable = true,
    canClose,
    onclose,
    children,
    footer,
  }: Props = $props();

  const titleId = $props.id();
  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  function handleClose(): void {
    // Browsers let a repeated Escape close a dialog even when "cancel" is prevented.
    // `open` still being true means the browser closed it, not the caller.
    if (open && (!dismissible || canClose?.() === false)) {
      dialog?.showModal();
      return;
    }
    open = false;
    onclose?.();
  }

  function onCancel(event: Event): void {
    if (!dismissible || canClose?.() === false) {
      event.preventDefault();
    }
  }

  /** Closing by the user, not by an action of the caller. */
  function dismiss(): void {
    if (canClose?.() !== false) {
      open = false;
    }
  }

  // Clicks on the backdrop land on the <dialog> element itself. A drag that starts inside
  // (selecting text, say) and ends on the backdrop is a click there too: ignore it.
  let pressedOnBackdrop = false;

  function onBackdropClick(event: MouseEvent): void {
    if (dismissible && pressedOnBackdrop && event.target === dialog) {
      dismiss();
    }
  }
</script>

<dialog
  bind:this={dialog}
  class={size}
  aria-labelledby={titleId}
  onclose={handleClose}
  oncancel={onCancel}
  onmousedown={(event) => (pressedOnBackdrop = event.target === dialog)}
  onclick={onBackdropClick}
>
  <header>
    <h2 id={titleId}>{title}</h2>
    {#if dismissible}
      <button type="button" class="close" aria-label={t('common.close')} onclick={dismiss}>
        <Icon name="close" size={18} />
      </button>
    {/if}
  </header>

  <div class="content" class:fixed={!scrollable} bind:this={contentElement}>
    {@render children()}
  </div>

  {#if footer}
    <footer>
      {@render footer()}
    </footer>
  {/if}
</dialog>

<style>
  dialog {
    max-height: min(85vh, 760px);
    padding: 0;
    overflow: hidden;
    border: 2px solid var(--color-frame);
    border-radius: var(--radius-large);
    background: var(--color-panel);
    color: var(--color-text);
  }

  dialog[open] {
    display: flex;
    flex-direction: column;
  }

  .small {
    width: min(420px, calc(100vw - 2 * var(--space-4)));
  }

  .medium {
    width: min(640px, calc(100vw - 2 * var(--space-4)));
  }

  .large {
    width: min(900px, calc(100vw - 2 * var(--space-4)));
    max-height: min(94vh, 960px);
  }

  dialog::backdrop {
    background: var(--color-overlay);
  }

  header {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--color-header);
    border-bottom: 1px solid var(--color-frame);
  }

  h2 {
    font-size: 18px;
    color: var(--color-header-text);
  }

  .close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 1px solid var(--color-header-control-border);
    border-radius: var(--radius-small);
    background: var(--color-header-control);
    color: var(--color-header-text);
    cursor: pointer;
  }

  .close:hover {
    background: var(--color-header-control-hover);
    border-color: var(--color-frame);
  }

  .content {
    flex: 1;
    min-height: 0;
    padding: var(--space-4);
    overflow-y: auto;
  }

  .content.fixed {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  footer {
    flex: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--color-frame-soft);
  }
</style>
