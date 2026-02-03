import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Generic Intercom OAuth callback dispatcher
 * Decodes the state token and redirects to the appropriate callback page:
 * - Onboarding flow (no workspaceId): /workspace/create/callback?flow=intercom
 * - Integration flow (has workspaceId): /:workspaceId/settings/integrations/intercom/callback
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
  let payload: { workspaceId?: string };
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
    console.error('Failed to decode OAuth state:', error);
    redirect('/workspace/create?error=invalid_state');
  }

  // Build query params for redirect
  const queryParams = new URLSearchParams({
    code,
    state,
  });

  // Check if workspaceId exists in payload to determine flow
  if (payload.workspaceId) {
    // Integration flow - redirect to workspace integration callback
    redirect(
      `/${payload.workspaceId}/settings/integrations/intercom/callback?${queryParams.toString()}`
    );
  } else {
    // Onboarding flow - redirect to workspace creation callback
    redirect(`/workspace/create/callback?flow=intercom&${queryParams.toString()}`);
  }
}
