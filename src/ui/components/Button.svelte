<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tooltip } from '../actions/tooltip';
  import Icon from './Icon.svelte';
  import type { IconName } from './icons';

  interface Props {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | undefined;
    size?: 'normal' | 'small' | undefined;
    type?: 'button' | 'submit' | undefined;
    icon?: IconName | undefined;
    /** Text for icon-only buttons; it becomes the accessible name. */
    label?: string | undefined;
    hint?: string | undefined;
    disabled?: boolean | undefined;
    /** Takes the focus when the dialog around it opens (the native autofocus rule). */
    autofocus?: boolean | undefined;
    onclick?: ((event: MouseEvent) => void) | undefined;
    children?: Snippet | undefined;
  }

  let {
    variant = 'secondary',
    size = 'normal',
    type = 'button',
    icon,
    label,
    hint,
    disabled = false,
    autofocus = false,
    onclick,
    children,
  }: Props = $props();

  const iconOnly = $derived(!children);
</script>

<!-- svelte-ignore a11y_autofocus (only for the main action of a dialog that just opened) -->
<button
  {type}
  class="button {variant} {size}"
  class:icon-only={iconOnly}
  aria-label={iconOnly ? label : undefined}
  {disabled}
  {autofocus}
  {onclick}
  use:tooltip={hint}
>
  {#if icon}
    <Icon name={icon} size={size === 'small' ? 16 : 18} />
  {/if}
  {#if children}
    <span>{@render children()}</span>
  {/if}
</button>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--control-height);
    padding: 0 var(--space-4);
    border: 1px solid transparent;
    border-radius: var(--radius-small);
    font-size: 14px;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast),
      transform var(--transition-fast);
  }

  .button:active:not(:disabled) {
    transform: translateY(1px);
  }

  .button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .small {
    min-height: 28px;
    padding: 0 var(--space-3);
    font-size: 13px;
  }

  .icon-only {
    padding: 0;
    width: var(--control-height);
  }

  .icon-only.small {
    width: 28px;
  }

  .primary {
    background: var(--color-primary);
    color: var(--color-primary-text);
  }

  .primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .secondary {
    background: transparent;
    border-color: var(--color-secondary-border);
    color: var(--color-text);
  }

  .secondary:hover:not(:disabled) {
    background: var(--color-secondary-hover);
    border-color: var(--color-frame);
  }

  .danger {
    background: var(--color-danger);
    color: var(--color-danger-text);
  }

  .danger:hover:not(:disabled) {
    background: var(--color-danger-hover);
  }

  .ghost {
    background: transparent;
    color: var(--color-text);
  }

  .ghost:hover:not(:disabled) {
    background: var(--color-secondary-hover);
  }
</style>
