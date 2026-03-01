'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@userplane/ui/components/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@userplane/ui/components/tabs';
import { useQueryState } from 'nuqs';

import { settingsTabParser, type SettingsTabValue } from '@/lib/parsers';

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

const SETTINGS_TABS = [
  { value: 'general', label: 'General' },
  { value: 'team', label: 'Team' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'plan-usage', label: 'Plans' },
  { value: 'customization', label: 'Customization' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'notifications', label: 'Notifications' },
] as const;

interface SettingsTabProps {
  onInviteClick?: () => void;
}

export function SettingsTab({ onInviteClick }: SettingsTabProps) {
  const [activeTab, setActiveTab] = useQueryState('tab', settingsTabParser);
  const handleTabChange = (value: string) => setActiveTab(value as SettingsTabValue);

  return (
    <div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Dropdown for narrow viewports (iPad Mini with sidebar, etc.) */}
        <div className="mb-6 lg:hidden">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SETTINGS_TABS.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab bar for wider viewports */}
        <TabsList className="mb-6 hidden lg:inline-flex">
          {SETTINGS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
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
