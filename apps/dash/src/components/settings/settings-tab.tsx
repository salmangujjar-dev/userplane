'use client';

import { useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { OverviewSection } from './overview-section';
import { AppearanceSection } from './appearance-section';
import { UsageSection } from './usage-section';
import { TeamSection } from './team-section';
import { IntegrationSection } from './integration-section';
import { DomainsSection } from './domains-section';
import { ProjectsSection } from './projects-section';
import { tabParser } from '@/lib/parsers';

export function SettingsTab() {
  const [activeTab, setActiveTab] = useQueryState('tab', tabParser.withDefault('general'));

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="plan-usage">Plans</TabsTrigger>
          <TabsTrigger value="recording-links">Recording Links</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8">
          <OverviewSection />
          <IntegrationSection />
        </TabsContent>

        <TabsContent value="team" className="space-y-8">
          <TeamSection />
        </TabsContent>

        <TabsContent value="plan-usage" className="space-y-8">
          <UsageSection />
        </TabsContent>

        <TabsContent value="recording-links" className="space-y-8">
          <AppearanceSection />
          <DomainsSection />
          <ProjectsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
