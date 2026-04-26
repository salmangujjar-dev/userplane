import { headers } from 'next/headers';

import { AppShell } from '@/components/layout/AppShell';
import { FlagHydrator } from '@/components/providers/FlagHydrator';
import { IntercomProvider } from '@/components/providers/IntercomProvider';
import { type UserIdentity, UserplaneProvider } from '@/components/providers/UserplaneProvider';
import { ZendeskProvider } from '@/components/providers/ZendeskProvider';
import { auth } from '@/lib/auth';
import { loadAndApplyOverrides } from '@/lib/feature-flag-service';
import { getVariantValue } from '@/lib/feature-flags';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessionPromise = headers().then((requestHeaders) =>
    auth.api.getSession({ headers: requestHeaders })
  );
  const [{ overrides, variantOverrides }, session] = await Promise.all([
    loadAndApplyOverrides(),
    sessionPromise,
  ]);

  const workspaceId = process.env.NEXT_PUBLIC_USERPLANE_WORKSPACE_ID!;
  const intercomAppId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID!;
  const zendeskKey = process.env.NEXT_PUBLIC_ZENDESK_KEY!;

  const user: UserIdentity = {
    user_id: session?.user?.id ?? '',
    user_name: session?.user?.name ?? '',
    user_email: session?.user?.email ?? '',
    user_company: process.env.NEXT_PUBLIC_RAMP_COMPANY_NAME ?? 'Spense',
    user_created_at: session?.user?.createdAt
      ? String(Math.floor(new Date(session.user.createdAt).getTime() / 1000))
      : '',
  };

  const supportProvider = getVariantValue('supportProvider');

  const content = (
    <>
      <FlagHydrator overrides={overrides} variantOverrides={variantOverrides} />
      <AppShell>{children}</AppShell>
    </>
  );

  const wrappedContent =
    supportProvider === 'intercom' ? (
      <IntercomProvider appId={intercomAppId}>{content}</IntercomProvider>
    ) : supportProvider === 'zendesk' ? (
      <ZendeskProvider zendeskKey={zendeskKey}>{content}</ZendeskProvider>
    ) : (
      content
    );

  return (
    <UserplaneProvider workspaceId={workspaceId} user={user}>
      {wrappedContent}
    </UserplaneProvider>
  );
}
