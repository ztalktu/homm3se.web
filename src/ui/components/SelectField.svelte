<script lang="ts" generics="Value extends string">
  /** Form select for short lists. Long, searchable lists use Combobox instead. */
  import { tooltip } from '../actions/tooltip';
  import { selectedOption } from '../logic/selectOption';

  interface Option {
    value: Value;
    label: string;
    disabled?: boolean | undefined;
  }

  interface Props {
    label: string;
    options: Option[];
    value: Value;
    hint?: string | undefined;
    disabled?: boolean | undefined;
    hideLabel?: boolean | undefined;
    onchange?: ((value: Value) => void) | undefined;
  }

  let {
    label,
    options,
    value = $bindable(),
    hint,
    disabled = false,
    hideLabel = false,
    onchange,
  }: Props = $props();

  const id = $props.id();

  function handleChange(event: Event): void {
    const option = selectedOption(event, options);
    if (option) {
      value = option.value;
      onchange?.(option.value);
    }
  }
</script>

<div class="select-field">
  <label class="field-label" class:visually-hidden={hideLabel} for={id}>{label}</label>
  <span class="control">
    <select
      {id}
      class="field-control"
      {value}
      {disabled}
      onchange={handleChange}
      use:tooltip={hint}
    >
      {#each options as option (option.value)}
        <option value={option.value} disabled={option.disabled}>{option.label}</option>
      {/each}
    </select>
  </span>
</div>

<style>
  .select-field {
    min-width: 0;
  }

  .control {
    position: relative;
    display: block;
  }

  .control::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 12px;
    width: 7px;
    height: 7px;
    border-right: 1.5px solid var(--color-field-text);
    border-bottom: 1.5px solid var(--color-field-text);
    transform: translateY(-70%) rotate(45deg);
    pointer-events: none;
  }

  select {
    appearance: none;
    padding-right: 32px;
    cursor: pointer;
  }
</style>
