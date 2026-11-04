<script lang="ts">
  import { dismissToast, toasts, type ToastKind } from '../../app/toasts.svelte';
  import { t } from '../../i18n/index.svelte';
  import Icon from './Icon.svelte';
  import type { IconName } from './icons';

  const ICON_BY_KIND: Record<ToastKind, IconName> = {
    info: 'info',
    success: 'check',
    warning: 'warning',
    error: 'warning',
  };

  let toaster: HTMLDivElement | undefined = $state();

  // Modal dialogs live in the browser's top layer. Showing the toaster as a popover puts it
  // there too, and re-showing it on every new toast keeps it above a dialog opened later.
  $effect(() => {
    const count = toasts.length;
    if (!toaster) {
      return;
    }
    if (toaster.matches(':popover-open')) {
      toaster.hidePopover();
    }
    if (count > 0) {
      toaster.showPopover();
    }
  });
</script>

<!-- Each toast is its own status or alert region; a live container around them would
     announce every message twice. -->
<div class="toaster" popover="manual" bind:this={toaster}>
  {#each toasts as toast (toast.id)}
    <div class="toast {toast.kind}" role={toast.kind === 'error' ? 'alert' : 'status'}>
      <Icon name={ICON_BY_KIND[toast.kind]} size={18} />
      <p>{toast.message}</p>
      <button type="button" aria-label={t('common.dismiss')} onclick={() => dismissToast(toast.id)}>
        <Icon name="close" size={16} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toaster {
    position: fixed;
    inset: auto;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: visible;
    right: var(--space-4);
    bottom: var(--space-6);
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-2);
    width: min(400px, calc(100vw - 2 * var(--space-4)));
    pointer-events: none;
  }

  /* Only lay out while shown, so the browser's own "hidden popover" rule keeps working. */
  .toaster:popover-open {
    display: flex;
  }

  .toast {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--color-frame);
    border-radius: var(--radius);
    background: var(--color-popover);
    color: var(--color-popover-text);
    box-shadow: var(--shadow-popover);
    pointer-events: auto;
  }

  .toast > :global(svg) {
    margin-top: 2px;
  }

  .success {
    background: var(--color-success);
    color: var(--color-success-text);
  }

  .warning {
    background: var(--color-warning);
    color: var(--color-warning-text);
  }

  .error {
    background: var(--color-danger);
    color: var(--color-danger-text);
  }

  p {
    flex: 1;
    margin: 0;
    font-size: 14px;
  }

  button {
    display: flex;
    padding: 2px;
    border: 0;
    border-radius: var(--radius-small);
    background: transparent;
    color: inherit;
    cursor: pointer;
    opacity: 0.8;
  }

  button:hover {
    opacity: 1;
  }
</style>
