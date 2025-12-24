'use client';

import { Sidebar } from '@/components/navigation/sidebar';
import { AccountSettingsSection } from '@/components/accounts/account-settings-section';

export default function PreferencesPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="h-[72px]" />
        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Account Settings</h2>
            <p className="text-sm text-muted-foreground">Manage your account settings</p>
          </div>

          <AccountSettingsSection />
        </main>
      </div>
    </div>
  );
}
