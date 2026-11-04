<script lang="ts" generics="Value extends string">
  import { tooltip } from '../actions/tooltip';

  interface Option {
    value: Value;
    label: string;
    hint?: string | undefined;
  }

  interface Props {
    legend: string;
    options: Option[];
    value: Value;
    direction?: 'row' | 'column' | undefined;
    onchange?: ((value: Value) => void) | undefined;
  }

  let { legend, options, value = $bindable(), direction = 'column', onchange }: Props = $props();

  const name = $props.id();
</script>

<fieldset class="radio-group">
  <legend class="field-label">{legend}</legend>
  <div class="options {direction}">
    {#each options as option, index (option.value)}
      <label class="radio" use:tooltip={option.hint}>
        <input
          type="radio"
          {name}
          value={option.value}
          bind:group={value}
          aria-describedby={option.hint ? `${name}-hint-${index}` : undefined}
          onchange={() => onchange?.(option.value)}
        />
        <span class="dot" aria-hidden="true"></span>
        <span>{option.label}</span>
        {#if option.hint}
          <span id={`${name}-hint-${index}`} class="visually-hidden">{option.hint}</span>
        {/if}
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .radio-group {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }

  .options {
    display: flex;
    gap: var(--space-1) var(--space-4);
  }

  .column {
    flex-direction: column;
  }

  .row {
    flex-wrap: wrap;
  }

  .radio {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 28px;
    cursor: pointer;
  }

  input {
    position: absolute;
    opacity: 0;
    width: 18px;
    height: 18px;
    margin: 0;
  }

  .dot {
    flex: none;
    position: relative;
    width: 18px;
    height: 18px;
    border: 1px solid var(--color-field-border);
    border-radius: 50%;
    background: var(--color-field);
  }

  .radio:hover .dot {
    border-color: var(--color-frame);
  }

  input:checked + .dot {
    border-color: var(--color-primary);
  }

  input:checked + .dot::after {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: var(--color-primary);
  }

  input:focus-visible + .dot {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
</style>
