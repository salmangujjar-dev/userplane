/**
 * Next.js instrumentation file
 * This file is used to initialize PostHog on the server for error capture
 * Learn more: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
import { PostHog } from 'posthog-node';

let serverPostHog: PostHog | null = null;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    const { env } = await import('./src/lib/env');
    if (env.posthog.apiKey) {
      serverPostHog = new PostHog(env.posthog.apiKey, {
        host: env.posthog.host,
        flushAt: 1,
        flushInterval: 0,
      });
    }
  }
}

export async function onRequestError(
  error: { digest?: string } & Error,
  request: { method: string },
  context: { routePath: string; routeType: string; renderSource: string }
) {
  if (serverPostHog) {
    serverPostHog.captureException(error, undefined, {
      app: 'dash',
      request_method: request.method,
      route_path: context.routePath,
      route_type: context.routeType,
      render_source: context.renderSource,
    });
    await serverPostHog.flush();
  }
}
