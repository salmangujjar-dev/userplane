'use client';

import { useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { WorkspaceSection } from './workspace-section';
import { RecordingLinkSection } from './recording-link-section';
import { WorkspacePlanSection } from './workspace-plan-section';
import { TeamSection } from './team-section';
import { InvitePolicySection } from './invite-policy-section';
import { IntegrationsSection } from './integrations-section';
import { DomainsSection } from './domains-section';
import { ProjectsSection } from './projects-section';
import { NotificationsSection } from './notifications-section';
import { tabParser } from '@/lib/parsers';

export function SettingsTab() {
  const [activeTab, setActiveTab] = useQueryState('tab', tabParser.withDefault('general'));

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="plan-usage">Plans</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8">
          <DomainsSection />
          <ProjectsSection />
        </TabsContent>

        <TabsContent value="team" className="space-y-8">
          <TeamSection />
          <InvitePolicySection />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-8">
          <IntegrationsSection />
        </TabsContent>

        <TabsContent value="plan-usage" className="space-y-8">
          <WorkspacePlanSection />
        </TabsContent>

        <TabsContent value="customization" className="space-y-8">
          <RecordingLinkSection />
          <WorkspaceSection />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-8">
          <NotificationsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
