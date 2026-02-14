import { redirect } from 'next/navigation';
import posthog from 'posthog-js';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Generic Intercom OAuth callback dispatcher
 * Decodes the JWT state token and redirects to the appropriate callback page based on:
 * - workspaceId: present -> existing workspace integration flow
 * - source: 'marketplace' -> workspace creation via Intercom App Store
 * - source: 'inapp' or absent -> workspace creation via in-app onboarding
 *
 * This keeps separation of concerns:
 * - This page: Simple redirect logic based on state
 * - Domain pages: Handle their respective API calls and flows
 */
export default async function IntercomCallbackPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = params.code;
  const state = params.state;

  // Validate required params
  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    redirect('/workspace/create?error=missing_oauth_params');
  }

  // Decode JWT state token (naive base64 decode of payload)
  // Full cryptographic verification happens on the API when the callback is processed
  let payload: { workspaceId?: string; source?: string };
  try {
    // JWT format: header.payload.signature
    const parts = state.split('.');
    if (parts.length !== 3 || !parts[1]) {
      redirect('/workspace/create?error=invalid_state');
    }

    // Decode payload (second part)
    payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
  } catch (error) {
    // Failed to decode state - redirect to error page
    posthog.captureException(error, {
      error_boundary: 'intercom-callback',
    });
    redirect('/workspace/create?error=invalid_state');
  }

  // Build query params for redirect
  const queryParams = new URLSearchParams({
    code,
    state,
  });

  if (payload.workspaceId) {
    // Integration flow - redirect to workspace integration callback
    redirect(
      `/workspace/${payload.workspaceId}/settings/integrations/intercom/callback?${queryParams.toString()}`
    );
  }

  // Workspace creation flow - route based on source
  const flow = payload.source === 'marketplace' ? 'intercom-marketplace' : 'intercom-inapp';
  redirect(`/workspace/create/callback?flow=${flow}&${queryParams.toString()}`);
}
