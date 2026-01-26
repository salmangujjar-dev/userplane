'use client';

import type { PlanId } from '@workspace/pricing';
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
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  FolderKanban,
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

import { PlanChangePreviewModal } from '@/components/modals/plan-change-preview-modal';
import { PlanSelectionModal } from '@/components/modals/plan-selection-modal';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { SidebarProjectsSkeleton } from '@/components/skeleton';
import { useAccount } from '@/hooks/use-account';
import { useAuth } from '@/hooks/use-auth';
import { useSession } from '@/hooks/use-session';
import { useWorkspace } from '@/hooks/use-workspace';
import { useWorkspaceProjects } from '@/hooks/use-workspace-projects';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { planModalParser } from '@/lib/parsers';
import { getPlanDisplay } from '@/lib/plan-display';
import { useSubscriptionStatus } from '@/queries/use-billing-queries';
import { useCreateCheckout } from '@/queries/use-checkout-mutations';
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

export function Sidebar() {
  const router = useRouter();
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
  const { data: workspacesResult } = useWorkspaces({ page: 1, perPage: 20, minimal: true });
  const { signOut } = useAuth();
  const { hasAdminAccess } = useSession();
  const { mutate: createCheckout } = useCreateCheckout();

  const account = accountResult?.success ? accountResult.data : null;
  const projectsData = projectsResult?.success ? projectsResult.data : null;
  const projects = projectsData?.projects ?? null;
  const projectsPagination = projectsData?.pagination;
  const workspace = workspaceResult?.success ? workspaceResult.data : null;
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const workspacesData = workspacesResult?.success ? workspacesResult.data : null;

  const hasPrevPage = projectsPage > 1;
  const hasNextPage = projectsPagination ? projectsPage < projectsPagination.totalPages : false;

  // State for plan change preview modal
  const [showPlanChangePreview, setShowPlanChangePreview] = useState(false);
  const [selectedPlanIdForChange, setSelectedPlanIdForChange] = useState<PlanId | null>(null);

  // Check if user has an active subscription that allows plan changes
  const hasActiveSubscription =
    subscriptionData?.contractDetail.planId !== null &&
    (subscriptionData?.contractDetail.status === 'active' ||
      (subscriptionData?.contractDetail.status === 'cancelled' &&
        subscriptionData?.contractDetail.cancelAtPeriodEnd));

  // Get plan display based on subscription status
  const planDisplay = getPlanDisplay(
    subscriptionData?.contractDetail.planName ?? null,
    subscriptionData?.contractDetail.status ?? null,
    subscriptionData?.contractDetail.cancelAtPeriodEnd
  );

  /**
   * Handle plan badge click - shows plan selection modal for all users
   */
  const handlePlanClick = () => {
    setPlanModal('suggested');
  };

  const handlePlanSelect = (planId: string) => {
    if (!workspaceId) return;

    if (hasActiveSubscription) {
      // Plan change flow - show preview modal
      setSelectedPlanIdForChange(planId as PlanId);
      setShowPlanChangePreview(true);
      setPlanModal(null);
    } else {
      // Checkout flow - create new subscription
      createCheckout({
        planId: planId as PlanId,
        workspaceId,
      });
      setPlanModal(null);
    }
  };

  const handlePlanChangeComplete = () => {
    setSelectedPlanIdForChange(null);
  };

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Recordings', href: `/${workspaceId}/recordings`, icon: Video },
        { label: 'Links', href: `/${workspaceId}/links`, icon: LinkIcon },
        { label: 'Settings', href: `/${workspaceId}/settings`, icon: Settings },
      ],
    },
    {
      title: 'Projects',
      items: isLoadingProjects
        ? []
        : projects?.map((project) => ({
            label: project.projectTitle || 'Untitled Project',
            href: `/${workspaceId}/projects/${project.projectId}`,
            icon: FolderKanban,
          })) || [],
    },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col shrink-0 bg-background">
      <div className="px-6 py-6 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/${workspaceId}/recordings`}>
            <Logo size="sm" />
          </Link>
          <button onClick={handlePlanClick}>
            <Badge
              variant="secondary"
              className="rounded-md text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              {planDisplay.displayName}
            </Badge>
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="px-6 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-foreground">{section.title}</div>
                {section.title === 'Projects' && (hasPrevPage || hasNextPage) && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setProjectsPage((p) => Math.max(1, p - 1))}
                      disabled={!hasPrevPage || isLoadingProjects}
                      className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous projects"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setProjectsPage((p) => p + 1)}
                      disabled={!hasNextPage || isLoadingProjects}
                      className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next projects"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                {section.title === 'Projects' && isLoadingProjects ? (
                  <SidebarProjectsSkeleton count={3} />
                ) : section.items.length === 0 && section.title === 'Projects' ? (
                  <div className="text-sm text-muted-foreground px-0 py-2">No projects yet</div>
                ) : (
                  section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 px-0 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {account && (
        <div className="px-4 py-4 shrink-0 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:bg-accent rounded-lg transition-colors w-full p-2">
                <BoringAvatar size={32} name={account.userName} />
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{account.userName}</div>
                  <div className="text-xs text-muted-foreground truncate">{account.userEmail}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-2">
              <div className="flex items-center gap-3 py-1.5 px-2">
                <BoringAvatar size={32} name={account.userName} />
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{account.userName}</div>
                  <div className="text-xs text-muted-foreground truncate">{account.userEmail}</div>
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
                            router.push(`/${ws.workspaceId}/recordings`);
                          }}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-left"
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm flex-1 truncate">{ws.workspaceName}</span>
                          {ws.workspaceId === workspaceId && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                    <DropdownMenuSeparator className="-mx-2 my-2" />
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
                href={`/${workspaceId}/account`}
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
                href="https://docs.userplane.com"
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
        </div>
      )}

      <PlanSelectionModal onPlanSelect={handlePlanSelect} />

      <PlanChangePreviewModal
        open={showPlanChangePreview}
        onOpenChange={setShowPlanChangePreview}
        newPlanId={selectedPlanIdForChange}
        onComplete={handlePlanChangeComplete}
      />
    </aside>
  );
}
