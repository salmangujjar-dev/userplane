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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: (async (options: any) => {
      const url = options?.url ?? '';
      // Mock /me endpoint
      if (url.includes('/zendesk/me')) {
        return {
          success: true,
          data: { workspaceId: 'ws_mock123', subdomain: 'mock-company', status: 'connected' },
        };
      }
      // Mock /projects endpoint
      if (url.includes('/zendesk/projects')) {
        return { success: true, data: { projects: [{ id: 'proj_1', name: 'Default Project' }] } };
      }
      // Mock /domains endpoint
      if (url.includes('/zendesk/domains')) {
        return {
          success: true,
          data: { domains: [{ id: 'dom_1', url: 'example.com', verified: true }] },
        };
      }
      // Mock /links endpoint
      if (url.includes('/zendesk/links')) {
        return {
          success: true,
          data: { linkId: 'link_mock', linkUrl: 'https://rec.example.com/link_mock' },
        };
      }
      // Mock /status endpoint
      if (url.includes('/zendesk/status')) {
        return { success: true, data: { status: 'healthy', workspaceId: 'ws_mock123' } };
      }
      return {};
    }) as ZAFClientInstance['request'],

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
        settings: {},
        appId: 1,
        name: 'Userplane (Mock)',
        installationId: 1,
      })),
  };

  return client;
}
