/**
 * `use:tooltip={text}` shows a hint on hover, on keyboard focus and on a long press.
 * One shared tooltip element is used for the whole page. Screen readers get the text
 * through `aria-description`, so the visual tooltip itself stays hidden from them.
 */

const SHOW_DELAY_MS = 450;
const LONG_PRESS_MS = 500;
const TOUCH_HIDE_DELAY_MS = 2500;
const GAP_PX = 8;
const VIEWPORT_MARGIN_PX = 8;

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

function place(target: HTMLElement, tip: HTMLDivElement): void {
  const anchor = target.getBoundingClientRect();
  const size = tip.getBoundingClientRect();
  const fitsBelow = anchor.bottom + GAP_PX + size.height <= window.innerHeight - VIEWPORT_MARGIN_PX;
  const top = fitsBelow ? anchor.bottom + GAP_PX : anchor.top - GAP_PX - size.height;
  const centered = anchor.left + anchor.width / 2 - size.width / 2;
  const maxLeft = window.innerWidth - VIEWPORT_MARGIN_PX - size.width;
  tip.style.top = `${Math.max(VIEWPORT_MARGIN_PX, top)}px`;
  tip.style.left = `${Math.min(Math.max(VIEWPORT_MARGIN_PX, centered), maxLeft)}px`;
}

export function tooltip(node: HTMLElement, text: string | undefined) {
  let currentText = text;
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  function applyDescription(): void {
    if (currentText) {
      node.setAttribute('aria-description', currentText);
    } else {
      node.removeAttribute('aria-description');
    }
  }

  function show(): void {
    clearTimeout(hideTimer);
    if (!currentText) {
      return;
    }
    const tip = getTooltipElement(node);
    owner = node;
    tip.textContent = currentText;
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
    showTimer = setTimeout(show, SHOW_DELAY_MS);
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
    update(nextText: string | undefined): void {
      currentText = nextText;
      applyDescription();
      if (owner === node && tooltipElement) {
        if (currentText) {
          tooltipElement.textContent = currentText;
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
