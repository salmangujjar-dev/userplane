import { OverviewSection } from './settings/overview-section';
import { UsageSection } from './settings/usage-section';
import { TeamSection } from './settings/team-section';
import { IntegrationSection } from './settings/integration-section';
import { DomainsSection } from './settings/domains-section';
import { DataSection } from './settings/data-section';
import { NotificationsSection } from './settings/notifications-section';

export function SettingsTab() {
  return (
    <div className="space-y-8">
      <OverviewSection />
      <UsageSection />
      <TeamSection />
      <IntegrationSection />
      <DomainsSection />
      <DataSection />
      <NotificationsSection />
    </div>
  );
}
