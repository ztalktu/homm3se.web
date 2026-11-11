<script lang="ts" generics="Value extends string | number">
  /**
   * Searchable select (WAI-ARIA combobox with a listbox popup).
   * Typing filters the list; ArrowUp/Down move, Enter picks, Escape closes.
   * With `allowCustom` any typed text is accepted (used for hero names, which may be
   * spelled differently in "crooked" translations); `value` is then set only on an exact match.
   */
  import { tooltip } from '../actions/tooltip';
  import { t } from '../../i18n/index.svelte';
  import { filterOptions, normalizeSearchText } from '../logic/filterOptions';
  import Icon from './Icon.svelte';
  import type { ComboboxItem } from './combobox';

  interface Props {
    label: string;
    items: ComboboxItem<Value>[];
    value: Value | null;
    text?: string | undefined;
    allowCustom?: boolean | undefined;
    placeholder?: string | undefined;
    hint?: string | undefined;
    disabled?: boolean | undefined;
    hideLabel?: boolean | undefined;
    onchange?: ((value: Value | null) => void) | undefined;
    /** An option picked from the list (click or Enter), even the one already selected. */
    onpick?: ((item: ComboboxItem<Value>) => void) | undefined;
    /** A click on a greyed-out option: lets the screen explain why it is not available. */
    ondisabledpick?: ((item: ComboboxItem<Value>) => void) | undefined;
  }

  let {
    label,
    items,
    value = $bindable(),
    text = $bindable(''),
    allowCustom = false,
    placeholder,
    hint,
    disabled = false,
    hideLabel = false,
    onchange,
    onpick,
    ondisabledpick,
  }: Props = $props();

  const POPUP_MAX_HEIGHT_PX = 300;
  const POPUP_GAP_PX = 4;
  /** Keeps a popup that opens near the window edge from touching it. */
  const VIEWPORT_MARGIN_PX = 8;
  const id = $props.id();
  const listboxId = `${id}-listbox`;

  let input: HTMLInputElement | undefined = $state();
  let popup: HTMLDivElement | undefined = $state();
  let popupStyle = $state('');
  let open = $state(false);
  let typed = $state(false);
  let focused = $state(false);
  let activeIndex = $state(-1);

  const selectedItem = $derived(items.find((item) => item.value === value));
  const visibleItems = $derived(typed ? filterOptions(items, text) : items);

  // Outside of editing, the input shows the label of the selected item.
  $effect(() => {
    if (!focused && !allowCustom) {
      text = selectedItem?.label ?? '';
    }
  });

  // Keep the active option visible by scrolling the popup only:
  // scrollIntoView would also scroll the page and move options under the mouse pointer.
  $effect(() => {
    if (!open || activeIndex < 0 || !popup) {
      return;
    }
    const option = document.getElementById(`${id}-option-${activeIndex}`);
    if (!option) {
      return;
    }
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < popup.scrollTop) {
      popup.scrollTop = top;
    } else if (bottom > popup.scrollTop + popup.clientHeight) {
      popup.scrollTop = bottom - popup.clientHeight;
    }
  });

  function firstEnabledIndex(list: ComboboxItem<Value>[]): number {
    return list.findIndex((item) => !item.disabled);
  }

  function openList(): void {
    if (disabled) {
      return;
    }
    typed = false;
    open = true;
    placePopup();
    const selectedIndex = items.findIndex((item) => item.value === value);
    activeIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex(items);
  }

  /**
   * The popup is fixed to the window, not to the field: inside a scrolling area (a dialog tab,
   * say) an absolutely placed list would stretch that area and get a scrollbar of its own there.
   * It opens upwards when there is not enough room below the field.
   */
  function placePopup(): void {
    if (!input) {
      return;
    }
    const rect = input.getBoundingClientRect();
    const viewportHeight = document.documentElement.clientHeight;
    const spaceBelow = viewportHeight - rect.bottom - POPUP_GAP_PX - VIEWPORT_MARGIN_PX;
    const spaceAbove = rect.top - POPUP_GAP_PX - VIEWPORT_MARGIN_PX;
    const opensUp = spaceBelow < POPUP_MAX_HEIGHT_PX && spaceAbove > spaceBelow;
    const maxHeight = Math.min(POPUP_MAX_HEIGHT_PX, opensUp ? spaceAbove : spaceBelow);
    const vertical = opensUp
      ? `bottom: ${viewportHeight - rect.top + POPUP_GAP_PX}px`
      : `top: ${rect.bottom + POPUP_GAP_PX}px`;
    popupStyle =
      `${vertical}; left: ${rect.left}px; width: ${rect.width}px; ` +
      `max-height: ${Math.max(maxHeight, 0)}px`;
  }

  // A fixed popup would drift away from a field that scrolls or moves: close it on any scroll
  // outside the list (as native selects do) and follow the field when the window resizes.
  $effect(() => {
    if (!open) {
      return;
    }
    const onScroll = (event: Event): void => {
      if (!(event.target instanceof Node && popup?.contains(event.target))) {
        close();
      }
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', placePopup);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', placePopup);
    };
  });

  function close(): void {
    open = false;
    typed = false;
    activeIndex = -1;
  }

  function choose(item: ComboboxItem<Value>): void {
    if (item.disabled) {
      ondisabledpick?.(item);
      return;
    }
    text = item.label;
    close();
    if (item.value !== value) {
      value = item.value;
      onchange?.(item.value);
    }
    onpick?.(item);
  }

  /** With free text: keep the text and select the item only when it matches exactly. */
  function commitCustomText(): void {
    const normalized = normalizeSearchText(text);
    const match = items.find((item) => normalizeSearchText(item.label) === normalized);
    const nextValue = match && !match.disabled ? match.value : null;
    if (nextValue !== value) {
      value = nextValue;
      onchange?.(nextValue);
    }
  }

  function move(direction: 1 | -1): void {
    const count = visibleItems.length;
    if (count === 0) {
      return;
    }
    let index = activeIndex;
    for (let attempt = 0; attempt < count; attempt += 1) {
      index = (index + direction + count) % count;
      if (!visibleItems[index]?.disabled) {
        activeIndex = index;
        return;
      }
    }
  }

  function onInput(): void {
    typed = true;
    if (!open) {
      placePopup();
    }
    open = true;
    activeIndex = firstEnabledIndex(filterOptions(items, text));
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (open) {
        move(event.key === 'ArrowDown' ? 1 : -1);
      } else {
        openList();
      }
    } else if (event.key === 'Enter') {
      const active = open ? visibleItems[activeIndex] : undefined;
      if (active) {
        event.preventDefault();
        choose(active);
      } else if (allowCustom) {
        close();
        commitCustomText();
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      close();
      if (!allowCustom) {
        text = selectedItem?.label ?? '';
      }
    }
  }

  function onBlur(): void {
    focused = false;
    close();
    if (allowCustom) {
      commitCustomText();
    }
  }

  function toggleFromButton(): void {
    if (open) {
      close();
    } else {
      input?.focus();
      openList();
    }
  }
</script>

<div class="combobox">
  <label class="field-label" class:visually-hidden={hideLabel} for={id}>{label}</label>
  <div class="control">
    <input
      bind:this={input}
      {id}
      class="field-control"
      type="text"
      role="combobox"
      autocomplete="off"
      spellcheck="false"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
      bind:value={text}
      {placeholder}
      {disabled}
      onfocus={() => (focused = true)}
      onblur={onBlur}
      oninput={onInput}
      onkeydown={onKeydown}
      onclick={() => !open && openList()}
      use:tooltip={hint}
    />
    <button
      type="button"
      class="toggle"
      tabindex="-1"
      aria-label={t('common.openList')}
      {disabled}
      onmousedown={(event) => event.preventDefault()}
      onclick={toggleFromButton}
    >
      <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} />
    </button>

    {#if open}
      <div class="popup" style={popupStyle} bind:this={popup}>
        {#if visibleItems.length === 0}
          <p class="empty">{t('common.noMatches')}</p>
        {/if}
        <ul id={listboxId} role="listbox" aria-label={label}>
          {#each visibleItems as item, index (item.value)}
            <!-- Mouse selection mirrors the keyboard handling on the combobox input. -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <li
              id={`${id}-option-${index}`}
              role="option"
              class:active={index === activeIndex}
              aria-selected={item.value === value}
              aria-disabled={item.disabled ? 'true' : undefined}
              onmousedown={(event) => event.preventDefault()}
              onmousemove={() => !item.disabled && (activeIndex = index)}
              onclick={() => choose(item)}
            >
              <span class="option-label">{item.label}</span>
              {#if item.description}
                <span class="option-description">{item.description}</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

<style>
  .combobox {
    min-width: 0;
  }

  .control {
    position: relative;
  }

  input {
    padding-right: 36px;
  }

  .toggle {
    position: absolute;
    top: 1px;
    right: 1px;
    bottom: 1px;
    width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 0 var(--radius-small) var(--radius-small) 0;
    background: transparent;
    color: var(--color-field-text);
    cursor: pointer;
  }

  .popup {
    position: fixed;
    z-index: 50;
    overflow-y: auto;
    /* Scrolling to the end of the list must not scroll (and so close) what lies beneath. */
    overscroll-behavior: contain;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-small);
    background: var(--color-popover);
    color: var(--color-popover-text);
    box-shadow: var(--shadow-popover);
  }

  ul {
    margin: 0;
    padding: var(--space-1) 0;
    list-style: none;
  }

  li {
    display: flex;
    flex-direction: column;
    padding: 6px var(--space-3);
    cursor: pointer;
  }

  li.active {
    background: var(--color-option-hover);
  }

  li[aria-selected='true'] {
    background: var(--color-option-selected);
  }

  li[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .option-label {
    font-size: 14px;
  }

  .option-description {
    font-size: 12px;
    opacity: 0.75;
  }

  .empty {
    margin: 0;
    padding: var(--space-2) var(--space-3);
    font-size: 13px;
    opacity: 0.75;
  }
</style>
