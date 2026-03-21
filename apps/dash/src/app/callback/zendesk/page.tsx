import { redirect, unstable_rethrow } from 'next/navigation';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Generic Zendesk OAuth callback dispatcher
 * Decodes the JWT state token and redirects to the appropriate callback page based on:
 * - workspaceId: present -> existing workspace integration flow
 * - source: 'marketplace' -> workspace creation via Zendesk Marketplace
 * - source: 'inapp' or absent -> workspace creation via in-app onboarding
 *
 * This keeps separation of concerns:
 * - This page: Simple redirect logic based on state
 * - Domain pages: Handle their respective API calls and flows
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

  // App OAuth flow — nested Zendesk OAuth returning during Zendesk built-in app install.
  // Must be checked BEFORE the workspaceId check since this flow also has a workspaceId.
  if (payload.source === 'app-oauth') {
    redirect(`/oauth/zendesk/callback?${queryParams.toString()}`);
  }

  if (payload.workspaceId) {
    // Integration flow - redirect to workspace integration callback
    redirect(
      `/workspace/${payload.workspaceId}/settings/integrations/zendesk/callback?${queryParams.toString()}`
    );
  }

  // Workspace creation flow - route based on source
  const flow = payload.source === 'marketplace' ? 'zendesk-marketplace' : 'zendesk-inapp';
  redirect(`/workspace/create/callback?flow=${flow}&${queryParams.toString()}`);
}
