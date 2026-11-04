<script lang="ts" generics="Value extends string">
  import { tooltip } from '../actions/tooltip';
  import { selectedOption } from '../logic/selectOption';

  /**
   * Compact select for the application header (language, theme).
   * Styled as part of the header, not as a form field.
   */
  interface Option {
    value: Value;
    label: string;
  }

  interface Props {
    label: string;
    hint: string;
    options: Option[];
    value: Value;
    onchange: (value: Value) => void;
  }

  let { label, hint, options, value, onchange }: Props = $props();

  const id = $props.id();

  function handleChange(event: Event): void {
    const option = selectedOption(event, options);
    if (option) {
      onchange(option.value);
    }
  }
</script>

<div class="header-select">
  <label for={id}>{label}</label>
  <span class="control">
    <select {id} {value} onchange={handleChange} use:tooltip={hint}>
      {#each options as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </span>
</div>

<style>
  .header-select {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  label {
    font-size: 13px;
    color: var(--color-header-label);
  }

  .control {
    position: relative;
    display: inline-flex;
  }

  /* Chevron drawn with borders so it follows the theme color. */
  .control::after {
    content: '';
    position: absolute;
    top: 50%;
    /* The header narrows the gap on phones through this variable. */
    right: var(--header-select-chevron-right, 10px);
    width: 6px;
    height: 6px;
    border-right: 1.5px solid var(--color-header-text);
    border-bottom: 1.5px solid var(--color-header-text);
    transform: translateY(-70%) rotate(45deg);
    pointer-events: none;
  }

  select {
    appearance: none;
    height: 30px;
    padding: 0 28px 0 var(--space-3);
    border: 1px solid var(--color-header-control-border);
    border-radius: var(--radius-small);
    background: var(--color-header-control);
    color: var(--color-header-text);
    cursor: pointer;
    transition:
      background var(--transition-fast),
      border-color var(--transition-fast);
  }

  select:hover {
    background: var(--color-header-control-hover);
    border-color: var(--color-frame);
  }

  option {
    background: var(--color-header-control);
    color: var(--color-header-text);
  }
</style>
