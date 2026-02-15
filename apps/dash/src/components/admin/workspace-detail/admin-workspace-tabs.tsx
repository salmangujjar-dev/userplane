'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useQueryState } from 'nuqs';

import { useAdminWorkspaceDetail } from '@/features/admin';
import { tabParser } from '@/lib/parsers';

import { EntitlementsTab } from './entitlements-tab';
import { MembersTab } from './members-tab';
import { OverviewTab } from './overview-tab';
import { ProjectsTab } from './projects-tab';
import { RecordingsTab } from './recordings-tab';
import { StatsTab } from './stats-tab';
import type { WorkspaceDetail } from './types';

interface AdminWorkspaceTabsProps {
  workspaceId: string;
  isAdmin: boolean;
}

export function AdminWorkspaceTabs({ workspaceId, isAdmin }: AdminWorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useQueryState('tab', tabParser.withDefault('overview'));

  const { data: workspaceDetailResult, isLoading: isLoadingWorkspaceDetail } =
    useAdminWorkspaceDetail(workspaceId, isAdmin);

  const workspaceDetail: WorkspaceDetail | null = workspaceDetailResult?.success
    ? workspaceDetailResult.data
    : null;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="projects">Projects</TabsTrigger>
        <TabsTrigger value="recordings">Recordings</TabsTrigger>
        <TabsTrigger value="entitlements">Entitlements</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8">
        <OverviewTab
          workspaceId={workspaceId}
          workspaceDetail={workspaceDetail}
          isLoading={isLoadingWorkspaceDetail}
        />
      </TabsContent>

      <TabsContent value="stats" className="space-y-8">
        <StatsTab workspaceDetail={workspaceDetail} isLoading={isLoadingWorkspaceDetail} />
      </TabsContent>

      <TabsContent value="members" className="space-y-8">
        <MembersTab workspaceId={workspaceId} isAdmin={isAdmin} />
      </TabsContent>

      <TabsContent value="projects" className="space-y-8">
        <ProjectsTab workspaceId={workspaceId} />
      </TabsContent>

      <TabsContent value="recordings" className="space-y-8">
        <RecordingsTab workspaceId={workspaceId} />
      </TabsContent>

      <TabsContent value="entitlements" className="space-y-8">
        <EntitlementsTab workspaceId={workspaceId} />
      </TabsContent>
    </Tabs>
  );
}
