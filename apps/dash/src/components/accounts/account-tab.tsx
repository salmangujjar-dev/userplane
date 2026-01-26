'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useQueryState } from 'nuqs';

import { tabParser } from '@/lib/parsers';

import { AccountSettingsSection } from './account-settings-section';
import { WorkspaceMembershipSection } from './workspace-membership-section';

export function AccountTab() {
  const [activeTab, setActiveTab] = useQueryState('tab', tabParser.withDefault('profile'));

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-8">
          <AccountSettingsSection />
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-8">
          <WorkspaceMembershipSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
