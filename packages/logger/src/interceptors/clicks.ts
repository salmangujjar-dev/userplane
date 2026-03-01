import { EXTENSION_TAG, LOGGER_NAME } from '../constants';
import { dispatch } from '../event-bridge';
import type { UserActionLogEvent } from '../types';
import { now } from '../utils/time';

let lastClickTime = 0;
let lastClickTarget: EventTarget | null = null;
const DEBOUNCE_MS = 120;

/**
 * Detects duplicate click events on the same target within the debounce window.
 */
function isDuplicateClick(event: Event): boolean {
  const now = performance.now();
  return event.target === lastClickTarget && now - lastClickTime < DEBOUNCE_MS;
}

function recordClick(event: Event): void {
  lastClickTime = performance.now();
  lastClickTarget = event.target;
}

/**
 * Creates and registers click/pointerdown handlers on document.
 * Returns the handler for later removal.
 */
export function patchClicks(tabId: string | undefined): (e: Event) => void {
  const handler = (event: Event): void => {
    const target = event.target as Element;

    // Skip extension elements
    if (target.tagName === EXTENSION_TAG) return;

    // Only track trusted, non-synthetic events
    if (!(event as PointerEvent).isTrusted || (event as PointerEvent).detail === 0) return;

    // Debounce duplicate clicks
    if (isDuplicateClick(event)) return;

    recordClick(event);

    dispatch({
      source: LOGGER_NAME,
      has_focus: window.__userplane_has_focus,
      tabId,
      type: 'user-action',
      timestamp: now(),
      data: {
        action: 'click',
        info: {
          tagName: target.tagName,
          id: target.id,
          classList: [...target.classList],
        },
        url: window.location.href,
      },
    } as UserActionLogEvent);
  };

  const options: AddEventListenerOptions = { capture: true, passive: true };
  document.addEventListener('pointerdown', handler, options);
  document.addEventListener('click', handler, options);

  return handler;
}
