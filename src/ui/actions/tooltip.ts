/**
 * `use:tooltip={text}` shows a hint on hover, on keyboard focus and on a long press.
 * One shared tooltip element is used for the whole page. Screen readers get the text
 * through `aria-description`, so the visual tooltip itself stays hidden from them.
 * A hint can also be a list: a title, groups of rows, each row maybe marked as added, removed,
 * changed, unchanged or skipped.
 */

const SHOW_DELAY_MS = 450;
const LONG_PRESS_MS = 500;
const TOUCH_HIDE_DELAY_MS = 2500;
const GAP_PX = 8;
const VIEWPORT_MARGIN_PX = 8;
/** A list longer than this is laid out in two columns. */
const WIDE_LIST_ROWS = 14;

let tooltipElement: HTMLDivElement | null = null;
let owner: HTMLElement | null = null;

/**
 * The tooltip lives inside the open modal <dialog> when its target is in one: a modal dialog
 * sits in the browser's top layer and would cover a tooltip attached to <body>.
 */
function getTooltipElement(target: HTMLElement): HTMLDivElement {
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'app-tooltip';
    tooltipElement.setAttribute('aria-hidden', 'true');
    tooltipElement.hidden = true;
  }
  const host = target.closest('dialog[open]') ?? document.body;
  if (tooltipElement.parentElement !== host) {
    host.append(tooltipElement);
  }
  return tooltipElement;
}

/**
 * Under the target, else over it. A hint too tall for both (a long list) goes beside the target,
 * on the roomier side: one laid over the target would sit under the pointer.
 */
function place(target: HTMLElement, tip: HTMLDivElement): void {
  const anchor = target.getBoundingClientRect();
  const size = tip.getBoundingClientRect();
  const maxTop = window.innerHeight - VIEWPORT_MARGIN_PX - size.height;
  const maxLeft = window.innerWidth - VIEWPORT_MARGIN_PX - size.width;
  const clamp = (value: number, max: number): number =>
    Math.max(VIEWPORT_MARGIN_PX, Math.min(value, max));
  const fitsBelow = anchor.bottom + GAP_PX <= maxTop;
  const fitsAbove = anchor.top - GAP_PX - size.height >= VIEWPORT_MARGIN_PX;
  if (fitsBelow || fitsAbove) {
    const top = fitsBelow ? anchor.bottom + GAP_PX : anchor.top - GAP_PX - size.height;
    tip.style.top = `${top}px`;
    tip.style.left = `${clamp(anchor.left + anchor.width / 2 - size.width / 2, maxLeft)}px`;
    return;
  }
  const roomRight = window.innerWidth - anchor.right;
  const left = roomRight >= anchor.left ? anchor.right + GAP_PX : anchor.left - GAP_PX - size.width;
  tip.style.top = `${clamp(anchor.top + anchor.height / 2 - size.height / 2, maxTop)}px`;
  tip.style.left = `${clamp(left, maxLeft)}px`;
}

export type TooltipMark = 'added' | 'removed' | 'changed' | 'same' | 'skipped';

export interface TooltipList {
  title: string;
  groups: {
    label?: string | undefined;
    rows: { text: string; mark?: TooltipMark | undefined }[];
  }[];
  note?: string | undefined;
}

/** What a hint shows: a text or a list. */
export type TooltipContent = string | TooltipList;

/** Hint content, or the content with its own delay before it shows (in place of the usual one). */
export type TooltipOptions =
  TooltipContent | { text: TooltipContent | undefined; delayMs: number } | undefined;

const MARK_SIGNS: Record<TooltipMark, string> = {
  added: '+',
  removed: '−',
  changed: '~',
  same: '',
  skipped: '×',
};

/** The hint as plain text, for screen readers. */
export function tooltipText(content: TooltipContent | undefined): string | undefined {
  if (content === undefined || typeof content === 'string') {
    return content;
  }
  const rows = content.groups.flatMap((group) => [
    ...(group.label ? [group.label] : []),
    ...group.rows.map((row) => `${row.mark ? MARK_SIGNS[row.mark] : ''} ${row.text}`.trim()),
  ]);
  return [content.title, ...rows, ...(content.note ? [content.note] : [])].join('\n');
}

function contentOf(options: TooltipOptions): TooltipContent | undefined {
  return typeof options === 'object' && 'delayMs' in options ? options.text : options;
}

function delayOf(options: TooltipOptions): number {
  return typeof options === 'object' && 'delayMs' in options ? options.delayMs : SHOW_DELAY_MS;
}

function element(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

/** Fills the tooltip; a long list goes into two columns. */
function render(tip: HTMLDivElement, content: TooltipContent): void {
  if (typeof content === 'string') {
    tip.classList.remove('list', 'wide');
    tip.textContent = content;
    return;
  }
  const rowCount = content.groups.reduce((sum, group) => sum + group.rows.length, 0);
  tip.classList.add('list');
  tip.classList.toggle('wide', rowCount > WIDE_LIST_ROWS);
  tip.replaceChildren(element('strong', 'tooltip-title', content.title));
  for (const group of content.groups) {
    if (group.label) {
      tip.append(element('span', 'tooltip-label', group.label));
    }
    const list = element('ul', 'tooltip-rows');
    for (const row of group.rows) {
      const item = element('li', row.mark ?? '');
      item.append(element('span', 'tooltip-sign', row.mark ? MARK_SIGNS[row.mark] : ''));
      item.append(element('span', '', row.text));
      list.append(item);
    }
    tip.append(list);
  }
  if (content.note) {
    tip.append(element('span', 'tooltip-note', content.note));
  }
}

export function tooltip(node: HTMLElement, options: TooltipOptions) {
  let current = contentOf(options);
  let showDelay = delayOf(options);
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  function applyDescription(): void {
    const text = tooltipText(current);
    if (text) {
      node.setAttribute('aria-description', text);
    } else {
      node.removeAttribute('aria-description');
    }
  }

  function show(): void {
    clearTimeout(hideTimer);
    if (!current) {
      return;
    }
    const tip = getTooltipElement(node);
    owner = node;
    render(tip, current);
    tip.hidden = false;
    place(node, tip);
  }

  function hide(): void {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    if (owner === node && tooltipElement) {
      tooltipElement.hidden = true;
      owner = null;
    }
  }

  function showLater(): void {
    clearTimeout(showTimer);
    showTimer = setTimeout(show, showDelay);
  }

  function onFocus(): void {
    // Only keyboard focus: a mouse click should not pop up a hint on top of the control.
    if (node.matches(':focus-visible')) {
      showLater();
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && owner === node) {
      hide();
    }
  }

  function onTouchStart(): void {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      show();
      hideTimer = setTimeout(hide, TOUCH_HIDE_DELAY_MS);
    }, LONG_PRESS_MS);
  }

  function onTouchEnd(): void {
    clearTimeout(showTimer);
  }

  applyDescription();
  node.addEventListener('mouseenter', showLater);
  node.addEventListener('mouseleave', hide);
  node.addEventListener('focus', onFocus);
  node.addEventListener('blur', hide);
  node.addEventListener('keydown', onKeydown);
  // Typing means the user knows what the field is for: get out of the way.
  node.addEventListener('input', hide);
  node.addEventListener('touchstart', onTouchStart, { passive: true });
  node.addEventListener('touchend', onTouchEnd);
  node.addEventListener('touchcancel', onTouchEnd);

  return {
    update(nextOptions: TooltipOptions): void {
      current = contentOf(nextOptions);
      showDelay = delayOf(nextOptions);
      applyDescription();
      if (owner === node && tooltipElement) {
        if (current) {
          render(tooltipElement, current);
          place(node, tooltipElement);
        } else {
          hide();
        }
      }
    },
    destroy(): void {
      hide();
      node.removeEventListener('mouseenter', showLater);
      node.removeEventListener('mouseleave', hide);
      node.removeEventListener('focus', onFocus);
      node.removeEventListener('blur', hide);
      node.removeEventListener('keydown', onKeydown);
      node.removeEventListener('input', hide);
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('touchcancel', onTouchEnd);
    },
  };
}
