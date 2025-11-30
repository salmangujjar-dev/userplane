import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { OverviewSection } from './overview-section';
import { AppearanceSection } from './appearance-section';
import { UsageSection } from './usage-section';
import { TeamSection } from './team-section';
import { IntegrationSection } from './integration-section';
import { WorkspacePlanSection } from './workspace-plan-section';
import { DomainsSection } from './domains-section';
import { ProjectsSection } from './projects-section';
import { StoreSection } from './store-section';
import { DataSection } from './data-section';

export function SettingsTab() {
  return (
    <div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="plan-usage">Plan & Usage</TabsTrigger>
          <TabsTrigger value="recording-links">Recording Links</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8">
          <OverviewSection />
          <IntegrationSection />
          <WorkspacePlanSection />
        </TabsContent>

        <TabsContent value="team" className="space-y-8">
          <TeamSection />
        </TabsContent>

        <TabsContent value="plan-usage" className="space-y-8">
          <UsageSection />
        </TabsContent>

        <TabsContent value="recording-links" className="space-y-8">
          <DomainsSection />
          <AppearanceSection />
          <ProjectsSection />
          <StoreSection />
          <DataSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
