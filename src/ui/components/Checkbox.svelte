<script lang="ts">
  import { tooltip } from '../actions/tooltip';

  interface Props {
    label: string;
    checked: boolean;
    hint?: string | undefined;
    disabled?: boolean | undefined;
    onchange?: ((checked: boolean) => void) | undefined;
  }

  let { label, checked = $bindable(), hint, disabled = false, onchange }: Props = $props();

  const hintId = $props.id();
</script>

<!-- The hint pops up over the whole label; the input points to it for keyboards and readers. -->
<label class="checkbox" class:disabled use:tooltip={hint}>
  <input
    type="checkbox"
    bind:checked
    {disabled}
    aria-describedby={hint ? hintId : undefined}
    onchange={() => onchange?.(checked)}
  />
  {#if hint}<span id={hintId} class="visually-hidden">{hint}</span>{/if}
  <span class="box" aria-hidden="true"></span>
  <span class="text">{label}</span>
</label>

<style>
  .checkbox {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 28px;
    cursor: pointer;
    user-select: none;
  }

  .disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  input {
    position: absolute;
    opacity: 0;
    width: 18px;
    height: 18px;
    margin: 0;
  }

  .box {
    flex: none;
    position: relative;
    width: 18px;
    height: 18px;
    border: 1px solid var(--color-field-border);
    border-radius: 4px;
    background: var(--color-field);
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast);
  }

  .checkbox:hover .box {
    border-color: var(--color-frame);
  }

  input:checked ~ .box {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }

  /* Check mark */
  input:checked ~ .box::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 1px;
    width: 5px;
    height: 10px;
    border-right: 2px solid var(--color-primary-text);
    border-bottom: 2px solid var(--color-primary-text);
    transform: rotate(45deg);
  }

  input:focus-visible ~ .box {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
</style>
