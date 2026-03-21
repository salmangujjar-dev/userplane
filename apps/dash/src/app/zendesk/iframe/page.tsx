import { env } from '@/env';

import { ZendeskApp } from './zendesk-app';

type Props = {
  searchParams: Promise<{ origin?: string; app_guid?: string }>;
};

/**
 * Server component for the Zendesk iframe page.
 * Extracts subdomain from origin param, resolves integration config from API,
 * and passes it to the client component.
 */
export default async function ZendeskIframePage({ searchParams }: Props) {
  const params = await searchParams;
  const subdomain = extractSubdomain(params.origin ?? '');

  let config: { apiToken: string; workspaceId: string; subdomain: string } | null = null;

  if (subdomain) {
    try {
      const res = await fetch(
        `${env.api.url}/api/v1/zendesk/resolve?subdomain=${encodeURIComponent(subdomain)}`,
        {
          headers: {
            'X-Internal-Key': process.env.INTERNAL_API_KEY ?? '',
          },
          cache: 'no-store',
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          config = {
            apiToken: data.apiToken,
            workspaceId: data.workspaceId,
            subdomain: data.subdomain,
          };
        }
      }
    } catch {
      // Failed to resolve — show setup screen
    }
  }

  return (
    <ZendeskApp
      config={config}
      subdomain={subdomain}
      apiUrl={env.api.url}
      dashboardUrl={env.dashboard.url}
    />
  );
}

function extractSubdomain(origin: string): string | null {
  try {
    const url = new URL(origin);
    const match = url.hostname.match(/^([^.]+)\.zendesk\.com$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
