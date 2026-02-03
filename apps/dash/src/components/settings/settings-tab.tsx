'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useQueryState } from 'nuqs';

import { tabParser } from '@/lib/parsers';

import { BillingSection } from './billing-section';
import { DomainsSection } from './domains-section';
import { IntegrationsSection } from './integrations-section';
import { InvitePolicySection } from './invite-policy-section';
import { NotificationsSection } from './notifications-section';
import { ProjectsSection } from './projects-section';
import { RecordingLinkSection } from './recording-link-section';
import { TeamSection } from './team-section';
import { WorkspacePlanSection } from './workspace-plan-section';
import { WorkspaceSection } from './workspace-section';

interface SettingsTabProps {
  onInviteClick?: () => void;
}

export function SettingsTab({ onInviteClick }: SettingsTabProps) {
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
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8">
          <DomainsSection />
          <ProjectsSection />
        </TabsContent>

        <TabsContent value="team" className="space-y-8">
          <TeamSection onInviteClick={onInviteClick} />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-8">
          <IntegrationsSection />
        </TabsContent>

        <TabsContent value="plan-usage" className="space-y-8">
          <WorkspacePlanSection />
        </TabsContent>

        <TabsContent value="customization" className="space-y-8">
          <RecordingLinkSection />
        </TabsContent>

        <TabsContent value="workspace" className="space-y-8">
          <WorkspaceSection />
          <BillingSection />
          <InvitePolicySection />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-8">
          <NotificationsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
