import { headers } from 'next/headers';

import { AppShell } from '@/components/layout/AppShell';
import { FlagHydrator } from '@/components/providers/FlagHydrator';
import { IntercomProvider } from '@/components/providers/IntercomProvider';
import { type UserIdentity, UserplaneProvider } from '@/components/providers/UserplaneProvider';
import { auth } from '@/lib/auth';
import { getOverridesMap, loadAndApplyOverrides } from '@/lib/feature-flag-service';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  loadAndApplyOverrides();
  const overrides = getOverridesMap();

  const session = await auth.api.getSession({ headers: await headers() });

  const workspaceId = process.env.NEXT_PUBLIC_USERPLANE_WORKSPACE_ID!;
  const intercomAppId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID!;

  const user: UserIdentity = {
    user_id: session?.user?.id ?? '',
    user_name: session?.user?.name ?? '',
    user_email: session?.user?.email ?? '',
    user_company: process.env.NEXT_PUBLIC_DEMO_USER_COMPANY ?? 'Spense',
    user_created_at: session?.user?.createdAt
      ? String(Math.floor(new Date(session.user.createdAt).getTime() / 1000))
      : '',
  };

  return (
    <UserplaneProvider workspaceId={workspaceId} user={user}>
      <IntercomProvider appId={intercomAppId}>
        <FlagHydrator overrides={overrides} />
        <AppShell>{children}</AppShell>
      </IntercomProvider>
    </UserplaneProvider>
  );
}
