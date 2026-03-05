import { redirect, unstable_rethrow } from 'next/navigation';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Generic Zendesk OAuth callback dispatcher
 * Decodes the JWT state token and redirects to the workspace integration callback page
 * Zendesk only supports workspace integration flow (no onboarding flow)
 */
export default async function ZendeskCallbackPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = params.code;
  const state = params.state;

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    redirect('/workspace/create?error=missing_oauth_params');
  }

  let payload: { workspaceId?: string };
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

  if (payload.workspaceId) {
    redirect(
      `/workspace/${payload.workspaceId}/settings/integrations/zendesk/callback?${queryParams.toString()}`
    );
  }

  // Zendesk doesn't support onboarding flow — redirect to error
  redirect('/workspace/create?error=invalid_zendesk_flow');
}
