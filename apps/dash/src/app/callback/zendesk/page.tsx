import { redirect, unstable_rethrow } from 'next/navigation';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Zendesk OAuth callback dispatcher
 * Decodes the JWT state token and routes to the popup OAuth callback.
 * All Zendesk connections go through the popup OAuth flow (app-oauth source).
 */
export default async function ZendeskCallbackPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = params.code;
  const state = params.state;

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    redirect('/workspace/create?error=missing_oauth_params');
  }

  // Decode JWT state token (naive base64 decode of payload)
  // Full cryptographic verification happens on the API when the callback is processed
  let payload: { workspaceId?: string; source?: string; pendingId?: string };
  try {
    const parts = state.split('.');
    if (parts.length !== 3 || !parts[1]) {
      redirect('/workspace/create?error=invalid_state');
    }
    payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
  } catch (error) {
    unstable_rethrow(error);
    redirect('/workspace/create?error=invalid_state');
  }

  const queryParams = new URLSearchParams({ code, state });

  // App OAuth flow — nested Zendesk OAuth completing during popup/built-in app install.
  // All Zendesk connection flows now go through the popup OAuth path.
  if (payload.source === 'app-oauth' || payload.source === 'integration') {
    redirect(`/oauth/zendesk/callback?${queryParams.toString()}`);
  }

  // Legacy provisioner flows (marketplace/inapp) are no longer supported.
  // Zendesk connection now happens from within the Zendesk app.
  redirect('/workspace/create');
}
