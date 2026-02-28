import { LOGGER_NAME } from '../constants';
import { dispatch } from '../event-bridge';
import type { UserActionLogEvent } from '../types';

/**
 * Creates and registers a beforeunload handler to track page unloads.
 * Returns the handler for later removal.
 */
export function patchBeforeUnload(tabId: string | undefined): (e: BeforeUnloadEvent) => void {
  const handler = (/* _event */): void => {
    dispatch({
      source: LOGGER_NAME,
      type: 'user-action',
      tabId,
      data: {
        action: 'page_unload',
        url: window.location.href,
      },
    } as UserActionLogEvent);
  };

  window.addEventListener('beforeunload', handler as EventListener, true);
  return handler;
}
