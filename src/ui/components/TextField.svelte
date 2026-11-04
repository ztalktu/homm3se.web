<script lang="ts">
  import { tooltip } from '../actions/tooltip';

  interface Props {
    label: string;
    value: string;
    hint?: string | undefined;
    placeholder?: string | undefined;
    maxlength?: number | undefined;
    error?: string | undefined;
    disabled?: boolean | undefined;
    /** Hide the visible label when the surrounding layout already names the field. */
    hideLabel?: boolean | undefined;
    onchange?: ((value: string) => void) | undefined;
  }

  let {
    label,
    value = $bindable(),
    hint,
    placeholder,
    maxlength,
    error,
    disabled = false,
    hideLabel = false,
    onchange,
  }: Props = $props();

  const id = $props.id();
</script>

<div class="text-field">
  <label class="field-label" class:visually-hidden={hideLabel} for={id}>{label}</label>
  <input
    {id}
    class="field-control"
    type="text"
    bind:value
    {placeholder}
    {maxlength}
    {disabled}
    autocomplete="off"
    spellcheck="false"
    aria-invalid={error ? 'true' : undefined}
    aria-errormessage={error ? `${id}-error` : undefined}
    onchange={() => onchange?.(value)}
    use:tooltip={hint}
  />
  {#if error}
    <p class="field-error" id={`${id}-error`}>{error}</p>
  {/if}
</div>

<style>
  .text-field {
    min-width: 0;
  }
</style>
