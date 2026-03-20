/**
 * Mock ZAF client for Storybook — allows location-level stories in the future
 */

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
      (async (...paths: string[]) => {
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
              result[path] = 'Test Ticket';
              break;
            case 'ticket.tags':
              result[path] = [];
              break;
            default:
              result[path] = null;
          }
        }
        return result;
      }),

    set: async () => {},

    invoke:
      overrides?.invoke ??
      (async (name: string, ...args: unknown[]) => {
        console.log(`[ZAF mock] invoke("${name}",`, ...args, ')');
      }),

    on(event: string, callback: (...args: unknown[]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(callback);

      if (event === 'app.registered') {
        setTimeout(
          () =>
            callback({
              metadata: {
                settings: { apiToken: 'mock', workspaceId: 'ws_mock' },
                appId: 1,
                name: 'Mock App',
                installationId: 1,
              },
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
        settings: { apiToken: 'mock-token', workspaceId: 'ws_mock123' },
        appId: 1,
        name: 'Userplane (Mock)',
        installationId: 1,
      })),
  };

  return client;
}
