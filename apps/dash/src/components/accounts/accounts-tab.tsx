import { AccountSettingsSection } from './account-settings-section';
import { WorkspaceSection } from './workspace-section';
import { NotificationSection } from './notification-section';
import { DataPrivacySection } from './data-privacy-section';

export function AccountsTab() {
  return (
    <div className="space-y-8">
      <AccountSettingsSection />
      <WorkspaceSection />
      <NotificationSection />
      <DataPrivacySection />
    </div>
  );
}
