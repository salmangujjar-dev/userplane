/**
 * Mock ZAF client for Storybook
 * Simulates the Zendesk Apps Framework SDK for testing zendesk components outside Zendesk.
 */

import type { ZAFClientInstance, ZAFMetadata } from '../../src/lib/zendesk/types';

type MockOverrides = Partial<{
  context: ZAFClientInstance['context'];
  get: ZAFClientInstance['get'];
  invoke: ZAFClientInstance['invoke'];
  metadata: ZAFClientInstance['metadata'];
}>;

export function createMockZAFClient(overrides?: MockOverrides): ZAFClientInstance {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  const client: ZAFClientInstance = {
    context: overrides?.context ?? (async () => ({ location: 'ticket_sidebar' })),

    get:
      overrides?.get ??
      (async (pathOrPaths: string | string[]) => {
        const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
        const result: Record<string, unknown> = {};
        for (const path of paths) {
          switch (path) {
            case 'currentUser.email':
              result[path] = 'agent@example.com';
              break;
            case 'currentUser.name':
              result[path] = 'Test Agent';
              break;
            case 'ticket.requester':
              result[path] = { email: 'customer@example.com', name: 'Test Customer' };
              break;
            case 'ticket.id':
              result[path] = '12345';
              break;
            case 'ticket.subject':
              result[path] = 'Help with screen recording';
              break;
            case 'ticket.priority':
              result[path] = 'normal';
              break;
            case 'ticket.type':
              result[path] = 'question';
              break;
            case 'ticket.tags':
              result[path] = ['support'];
              break;
            default:
              result[path] = null;
          }
        }
        return result;
      }),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: (async () => ({})) as any,

    set: async () => {},

    invoke:
      overrides?.invoke ??
      (async (name: string, ...args: unknown[]) => {
        console.log(`[ZAF mock] invoke("${name}",`, ...args, ')');
      }),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, callback: (...args: any[]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(callback);

      if (event === 'app.registered') {
        setTimeout(
          () =>
            callback({
              metadata: {
                settings: {},
                appId: 1,
                name: 'Userplane (Mock)',
                installationId: 1,
              } satisfies ZAFMetadata,
              context: { location: 'ticket_sidebar' },
            }),
          0
        );
      }
    },

    off(event: string, callback: (...args: unknown[]) => void) {
      listeners.get(event)?.delete(callback);
    },

    trigger(event: string, data?: unknown) {
      listeners.get(event)?.forEach((cb) => cb(data));
    },

    metadata:
      overrides?.metadata ??
      (async () => ({
        settings: {},
        appId: 1,
        name: 'Userplane (Mock)',
        installationId: 1,
      })),
  };

  return client;
}
