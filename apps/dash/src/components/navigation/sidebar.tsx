'use client';

import { Badge } from '@workspace/ui/components/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import Logo from '@workspace/ui/components/logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  FolderKanban,
  Folders,
  HelpCircle,
  Link as LinkIcon,
  LogOut,
  Plus,
  Settings,
  Settings2,
  Shield,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { WORKSPACE_AVATAR_SIZES, WorkspaceAvatar } from '@/components/shared/workspace-avatar';
import { SidebarProjectsSkeleton } from '@/components/skeleton';
import { SUPPORT_LINKS } from '@/constants';
import { useAccount } from '@/features/account';
import { useSession } from '@/features/auth';
import { useSubscriptionStatus } from '@/features/billing';
import { useWorkspaceProjects } from '@/features/projects';
import { useWorkspace, useWorkspaces } from '@/features/workspace';
import { useAuth } from '@/hooks/use-auth';
import { planModalParser } from '@/lib/parsers';
import { getPlanDisplay } from '@/lib/plan-display';
import { useWorkspaceId, useWorkspaceStore } from '@/stores/workspace';

const SIDEBAR_PROJECTS_PER_PAGE = 5;

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AppSidebar() {
  const router = useRouter();
  const { state: sidebarState } = useSidebar();
  const workspaceId = useWorkspaceId();
  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);
  const { data: accountResult } = useAccount();
  const [projectsPage, setProjectsPage] = useState(1);
  const [, setPlanModal] = useQueryState('plan-modal', planModalParser);
  const { data: projectsResult, isLoading: isLoadingProjects } = useWorkspaceProjects({
    perPage: SIDEBAR_PROJECTS_PER_PAGE,
    page: projectsPage,
  });
  const { data: workspaceResult } = useWorkspace();
  const { data: subscriptionResult } = useSubscriptionStatus();
  const { data: workspacesResult } = useWorkspaces({
    page: 1,
    perPage: 20,
    includeWorkspaceMembership: false,
  });
  const { signOut } = useAuth();
  const { hasAdminAccess } = useSession();

  const account = accountResult?.success ? accountResult.data : null;
  const projectsData = projectsResult?.success ? projectsResult.data : null;
  const projects = projectsData?.projects ?? null;
  const projectsPagination = projectsData?.pagination;
  const workspace = workspaceResult?.success ? workspaceResult.data : null;
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const workspacesData = workspacesResult?.success ? workspacesResult.data : null;

  const hasPrevPage = projectsPage > 1;
  const hasNextPage = projectsPagination ? projectsPage < projectsPagination.totalPages : false;

  // Get plan display based on subscription status
  const planDisplay = getPlanDisplay(
    subscriptionData?.contractDetail.planName ?? null,
    subscriptionData?.contractDetail.status ?? null,
    subscriptionData?.contractDetail.cancelAtPeriodEnd,
    undefined,
    subscriptionData?.contractDetail.trialEnd
  );

  /**
   * Handle plan badge click - shows plan selection modal for all users
   * Shows detailed mode (all plans) if no subscription, suggested mode otherwise
   */
  const handlePlanClick = () => {
    const accessStatus = subscriptionData?.accessDetail.accessStatus;
    const hasActiveSubscription =
      subscriptionData?.contractDetail.planId &&
      (accessStatus === 'active' || accessStatus === 'trial');

    // No subscription → show all plans (detailed mode)
    // Has subscription → show suggested upgrade plans
    setPlanModal(hasActiveSubscription ? 'suggested' : 'detailed');
  };

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Recordings', href: `/workspace/${workspaceId}/recordings`, icon: Video },
        { label: 'Links', href: `/workspace/${workspaceId}/links`, icon: LinkIcon },
        { label: 'Settings', href: `/workspace/${workspaceId}/settings`, icon: Settings },
      ],
    },
    {
      title: 'Projects',
      items: isLoadingProjects
        ? []
        : projects?.map((project) => ({
            label: project.projectTitle || 'Untitled Project',
            href: `/workspace/${workspaceId}/projects/${project.projectId}`,
            icon: FolderKanban,
          })) || [],
    },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <Link href={`/workspace/${workspaceId}/recordings`}>
            <Logo size="sm" showText={sidebarState !== 'collapsed'} />
          </Link>
          <button onClick={handlePlanClick} className="group-data-[collapsible=icon]:hidden">
            <Badge
              variant="secondary"
              className="rounded-md text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              {planDisplay.displayName}
            </Badge>
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>
              <span className="flex-1">{section.title}</span>
              {section.title === 'Projects' && (hasPrevPage || hasNextPage) && (
                <span className="flex items-center gap-1">
                  <button
                    onClick={() => setProjectsPage((p) => Math.max(1, p - 1))}
                    disabled={!hasPrevPage || isLoadingProjects}
                    className="p-0.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous projects"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setProjectsPage((p) => p + 1)}
                    disabled={!hasNextPage || isLoadingProjects}
                    className="p-0.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next projects"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </span>
              )}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.title === 'Projects' && isLoadingProjects ? (
                <SidebarProjectsSkeleton count={3} />
              ) : section.items.length === 0 && section.title === 'Projects' ? (
                <div className="text-sm text-muted-foreground px-2 py-2">No projects yet</div>
              ) : (
                section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {account && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" tooltip={account.userName}>
                    <BoringAvatar
                      size={AVATAR_SIZES.USER}
                      name={account.userName}
                      email={account.userEmail}
                    />
                    <div className="flex flex-col text-left flex-1 min-w-0">
                      <span className="text-sm font-semibold truncate">{account.userName}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {account.userEmail}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-2" side="top">
                  <div className="flex items-center gap-3 py-1.5 px-2">
                    <BoringAvatar
                      size={AVATAR_SIZES.USER}
                      name={account.userName}
                      email={account.userEmail}
                    />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{account.userName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {account.userEmail}
                      </div>
                    </div>
                  </div>
                  <div className="py-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors border border-border">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium flex-1 truncate text-center">
                            {workspace?.workspace.workspaceName || 'Select Workspace'}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 p-2">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                          Workspaces
                        </div>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {workspacesData?.workspaces?.map((ws) => (
                            <button
                              key={ws.workspaceId}
                              onClick={() => {
                                setWorkspaceStore(ws.workspaceId);
                                router.push(`/workspace/${ws.workspaceId}/recordings`);
                              }}
                              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-left"
                            >
                              <WorkspaceAvatar
                                workspaceId={ws.workspaceId}
                                workspaceName={ws.workspaceName}
                                size={WORKSPACE_AVATAR_SIZES.COMPACT}
                              />
                              <span className="text-sm flex-1 truncate">{ws.workspaceName}</span>
                              {ws.workspaceId === workspaceId && (
                                <Check className="h-4 w-4 text-primary shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                        <DropdownMenuSeparator className="-mx-2 my-2" />
                        <button
                          onClick={() =>
                            router.push(`/workspace/${workspaceId}/account?tab=workspaces`)
                          }
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                        >
                          <Folders className="h-4 w-4" />
                          Show Workspaces
                        </button>
                        <button
                          onClick={() => router.push('/workspace/create')}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                        >
                          <Plus className="h-4 w-4" />
                          Create Workspace
                        </button>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <DropdownMenuSeparator className="-mx-2 my-2" />
                  <Link
                    href={`/workspace/${workspaceId}/account`}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                  >
                    <Settings2 className="h-4 w-4" />
                    Account
                  </Link>
                  {hasAdminAccess && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  <DropdownMenuSeparator className="-mx-2 my-2" />
                  <a
                    href={SUPPORT_LINKS.helpCenter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help
                  </a>
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer mx-0"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  );
}
