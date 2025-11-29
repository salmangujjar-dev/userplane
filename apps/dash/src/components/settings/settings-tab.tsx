import { OverviewSection } from './overview-section';
import { AppearanceSection } from './appearance-section';
import { UsageSection } from './usage-section';
import { TeamSection } from './team-section';
import { IntegrationSection } from './integration-section';
import { DomainsSection } from './domains-section';
import { ProjectsSection } from './projects-section';
import { StoreSection } from './store-section';
import { DataSection } from './data-section';

export function SettingsTab() {
  return (
    <div className="space-y-8">
      <OverviewSection />
      <IntegrationSection />
      <UsageSection />
      <TeamSection />
      <DomainsSection />
      <ProjectsSection />
      <StoreSection />
      <DataSection />
      <AppearanceSection />
    </div>
  );
}
