<script lang="ts">
  /**
   * Integer input with steppers, like the old edit + UpDown pair.
   * Accepts digits only, steps with the arrow buttons, ArrowUp/Down (±step),
   * PageUp/Down (±bigStep), Home/End (min/max), and clamps the value on blur.
   * A click on a stepper moves by one step; holding it repeats, faster and faster.
   */
  import { tooltip } from '../actions/tooltip';
  import { t } from '../../i18n/index.svelte';
  import {
    HOLD,
    clamp,
    holdInterval,
    holdStep,
    parseNumberText,
    roundStep,
    sanitizeNumberText,
    stepNumber,
  } from '../logic/numberInput';
  import Icon from './Icon.svelte';

  interface Props {
    label: string;
    value: number;
    min?: number | undefined;
    max: number;
    step?: number | undefined;
    bigStep?: number | undefined;
    hint?: string | undefined;
    disabled?: boolean | undefined;
    hideLabel?: boolean | undefined;
    onchange?: ((value: number) => void) | undefined;
  }

  let {
    label,
    value = $bindable(),
    min = 0,
    max,
    step = 1,
    bigStep = step * 10,
    hint,
    disabled = false,
    hideLabel = false,
    onchange,
  }: Props = $props();

  const id = $props.id();
  let text = $state('');
  let editing = $state(false);

  // Show the bound value unless the user is in the middle of typing.
  $effect(() => {
    if (!editing) {
      text = String(value);
    }
  });

  function commit(next: number): void {
    const clamped = clamp(next, min, max);
    if (clamped !== value) {
      value = clamped;
      onchange?.(clamped);
    }
    text = String(clamped);
  }

  // Holding a stepper: one step at once, then repeats after a pause, ever faster.
  let holdTimer: ReturnType<typeof setTimeout> | undefined;

  function stopHold(): void {
    clearTimeout(holdTimer);
    holdTimer = undefined;
    window.removeEventListener('pointerup', stopHold);
    window.removeEventListener('pointercancel', stopHold);
    window.removeEventListener('blur', stopHold);
  }

  function startHold(event: PointerEvent, direction: 1 | -1): void {
    if (event.button !== 0) {
      return;
    }
    stopHold();
    commit(stepNumber(value, direction * step, min, max));
    window.addEventListener('pointerup', stopHold);
    window.addEventListener('pointercancel', stopHold);
    window.addEventListener('blur', stopHold);
    let repeat = 0;
    const tick = (): void => {
      const size = holdStep(repeat, step, min, max);
      commit(roundStep(value, size, direction, min, max));
      if (value <= min || value >= max) {
        stopHold();
        return;
      }
      holdTimer = setTimeout(tick, holdInterval(repeat));
      repeat += 1;
    };
    holdTimer = setTimeout(tick, HOLD.delayMs);
  }

  $effect(() => stopHold);

  /** Keyboard or assistive tech pressing the button: a plain click with no pointer. */
  function onStepperClick(event: MouseEvent, direction: 1 | -1): void {
    if (event.detail === 0) {
      commit(stepNumber(value, direction * step, min, max));
    }
  }

  function onInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const sanitized = sanitizeNumberText(input.value, min < 0);
    if (sanitized !== input.value) {
      input.value = sanitized;
    }
    text = sanitized;
    const parsed = parseNumberText(sanitized);
    if (parsed !== null && parsed >= min && parsed <= max && parsed !== value) {
      value = parsed;
      onchange?.(parsed);
    }
  }

  function onBlur(): void {
    editing = false;
    commit(parseNumberText(text) ?? min);
  }

  function onKeydown(event: KeyboardEvent): void {
    const deltas: Record<string, number> = {
      ArrowUp: step,
      ArrowDown: -step,
      PageUp: bigStep,
      PageDown: -bigStep,
    };
    const delta = deltas[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      commit(stepNumber(value, delta, min, max));
    } else if (event.key === 'Home') {
      event.preventDefault();
      commit(min);
    } else if (event.key === 'End') {
      event.preventDefault();
      commit(max);
    } else if (event.key === 'Enter') {
      commit(parseNumberText(text) ?? min);
    }
  }
</script>

<div class="number-field">
  <label class="field-label" class:visually-hidden={hideLabel} for={id}>{label}</label>
  <div class="control">
    <input
      {id}
      class="field-control"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      role="spinbutton"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      value={text}
      {disabled}
      onfocus={() => (editing = true)}
      oninput={onInput}
      onblur={onBlur}
      onkeydown={onKeydown}
      use:tooltip={hint}
    />
    <!-- Quick repeated clicks are a double or triple click: without preventDefault they
         select the text around the field. -->
    <!-- A long press on a touch screen would otherwise open the context menu. -->
    <div
      class="steppers"
      onmousedown={(event) => event.preventDefault()}
      oncontextmenu={(event) => event.preventDefault()}
      role="presentation"
    >
      <button
        type="button"
        tabindex="-1"
        aria-label={t('common.increase')}
        disabled={disabled || value >= max}
        onpointerdown={(event) => startHold(event, 1)}
        onclick={(event) => onStepperClick(event, 1)}
      >
        <Icon name="chevronUp" size={14} />
      </button>
      <button
        type="button"
        tabindex="-1"
        aria-label={t('common.decrease')}
        disabled={disabled || value <= min}
        onpointerdown={(event) => startHold(event, -1)}
        onclick={(event) => onStepperClick(event, -1)}
      >
        <Icon name="chevronDown" size={14} />
      </button>
    </div>
  </div>
</div>

<style>
  .number-field {
    min-width: 0;
  }

  .control {
    position: relative;
  }

  input {
    padding-right: 30px;
    font-variant-numeric: tabular-nums;
  }

  .steppers {
    position: absolute;
    top: 1px;
    right: 1px;
    bottom: 1px;
    display: flex;
    flex-direction: column;
    width: 24px;
    user-select: none;
    border-left: 1px solid var(--color-field-border);
    touch-action: none;
    -webkit-touch-callout: none;
  }

  .steppers button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-field-text);
    cursor: pointer;
  }

  .steppers button:first-child {
    border-bottom: 1px solid var(--color-field-border);
    border-top-right-radius: var(--radius-small);
  }

  .steppers button:last-child {
    border-bottom-right-radius: var(--radius-small);
  }

  .steppers button:hover:not(:disabled) {
    background: var(--color-option-hover);
  }

  .steppers button:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
