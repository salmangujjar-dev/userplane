import { LOGGER_NAME } from '../constants';
import { dispatch } from '../event-bridge';
import type { ConsoleLogEvent } from '../types';

/**
 * Creates and registers a handler for Content Security Policy violations.
 * Returns the handler for later removal.
 */
export function patchCSP(): (e: SecurityPolicyViolationEvent) => void {
  const handler = (event: SecurityPolicyViolationEvent): void => {
    const message = `Refused to load ${
      event.blockedURI ? `'${event.blockedURI}'` : 'a resource'
    } because it violates the following Content Security Policy directive: "${event.violatedDirective}".`;

    try {
      dispatch({
        source: LOGGER_NAME,
        has_focus: window.__userplane_has_focus,
        type: 'console',
        subtype: 'securitypolicyviolation',
        level: 'error',
        args: [message],
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        effectiveType: event.effectiveDirective,
        disposition: event.disposition,
        originalPolicy: event.originalPolicy,
        statusCode: event.statusCode,
        timestamp: Date.now(),
      } as ConsoleLogEvent);
      // eslint-disable-next-line no-empty -- intentional: CSP handler must not throw
    } catch {}
  };

  window.addEventListener('securitypolicyviolation', handler as EventListener, true);
  return handler;
}
