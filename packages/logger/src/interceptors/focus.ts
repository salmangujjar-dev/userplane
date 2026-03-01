import { LOGGER_NAME } from '../constants';
import { dispatch } from '../event-bridge';
import type { UserActionLogEvent } from '../types';
import { now } from '../utils/time';

/**
 * Creates and registers focus/blur/visibilitychange handlers.
 * Tracks tab activation/deactivation state changes.
 * Returns the handler for later removal.
 */
export function patchFocus(tabId: string | undefined): (e: Event) => void {
  const handler = (event: Event): void => {
    const wasFocused = window.__userplane_has_focus;
    window.__userplane_has_focus = event.type === 'focus' || document.visibilityState === 'visible';

    const action = window.__userplane_has_focus ? 'tab_activated' : 'tab_deactivated';

    // Only emit when state actually changes
    if (wasFocused !== window.__userplane_has_focus) {
      dispatch({
        source: LOGGER_NAME,
        has_focus: window.__userplane_has_focus,
        tabId,
        type: 'user-action',
        timestamp: now(),
        data: {
          action,
          url: window.location.href,
          title: document.title,
        },
      } as UserActionLogEvent);
    }
  };

  window.addEventListener('focus', handler, true);
  window.addEventListener('blur', handler, true);
  document.addEventListener('visibilitychange', handler, true);

  return handler;
}

/**
 * Initializes focus state and emits init_page event if tab is visible.
 */
export function initFocusState(tabId: string | undefined): void {
  window.__userplane_has_focus = document.visibilityState === 'visible';

  if (window.__userplane_has_focus) {
    dispatch({
      source: LOGGER_NAME,
      has_focus: window.__userplane_has_focus,
      tabId,
      type: 'user-action',
      timestamp: now(),
      data: {
        action: 'init_page',
        url: window.location.href,
        title: document.title,
      },
    } as UserActionLogEvent);
  }
}
