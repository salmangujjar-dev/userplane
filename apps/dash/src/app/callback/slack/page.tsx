import { redirect, unstable_rethrow } from 'next/navigation';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Generic Slack OAuth callback dispatcher
 * Decodes the JWT state token and redirects to the workspace callback page.
 * Slack only connects to existing workspaces (no workspace creation flow).
 */
export default async function SlackCallbackPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = params.code;
  const state = params.state;

  // Validate required params
  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    redirect('/?error=missing_oauth_params');
  }

  // Decode JWT state token (naive base64 decode of payload)
  // Full cryptographic verification happens on the API when the callback is processed
  let payload: { workspaceId?: string };
  try {
    // JWT format: header.payload.signature
    const parts = state.split('.');
    if (parts.length !== 3 || !parts[1]) {
      redirect('/?error=invalid_state');
    }

    // Decode payload (second part)
    payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
  } catch (error) {
    unstable_rethrow(error);
    // Failed to decode state - redirect to error page
    redirect('/?error=invalid_state');
  }

  if (!payload.workspaceId) {
    // Slack requires an existing workspace
    redirect('/?error=missing_workspace');
  }

  // Build query params for redirect
  const queryParams = new URLSearchParams({
    code,
    state,
  });

  // Redirect to workspace integration callback
  redirect(
    `/workspace/${payload.workspaceId}/settings/integrations/slack/callback?${queryParams.toString()}`
  );
}
