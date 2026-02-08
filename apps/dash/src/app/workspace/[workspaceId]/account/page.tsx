'use client';

import { AccountTab } from '@/components/accounts/account-tab';
import { PageHeader } from '@/components/navigation/page-header';

export default function PreferencesPage() {
  return (
    <>
      <PageHeader title="Account Settings" description="Manage your account settings" />

      <main className="flex-1 overflow-y-auto px-6 pb-8">
        <AccountTab />
      </main>
    </>
  );
}
