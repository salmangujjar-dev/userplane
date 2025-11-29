import { OverviewSection } from './overview-section';
import { UsageSection } from './usage-section';
import { TeamSection } from './team-section';
import { IntegrationSection } from './integration-section';
import { DomainsSection } from './domains-section';
import { ProjectsSection } from './projects-section';
import { DataSection } from './data-section';
import { NotificationsSection } from './notifications-section';

export function SettingsTab() {
  return (
    <div className="space-y-8">
      <OverviewSection />
      <IntegrationSection />
      <UsageSection />
      <TeamSection />
      <DomainsSection />
      <ProjectsSection />
      <DataSection />
      <NotificationsSection />
    </div>
  );
}
