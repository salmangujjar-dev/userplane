'use client';

import Link from 'next/link';
import Logo from '@workspace/ui/components/logo';
import { Badge } from '@workspace/ui/components/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import {
  Video,
  Link as LinkIcon,
  Settings,
  FolderKanban,
  KeyRound,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useWorkspaceId } from '@/stores/workspace';
import { useAccount } from '@/hooks/use-account';
import { useWorkspaceProjects } from '@/hooks/use-workspace-projects';
import { useWorkspace } from '@/hooks/use-workspace';
import { DEFAULT_PLAN_NAME } from '@workspace/pricing';

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
  const workspaceId = useWorkspaceId();
  const { data: account } = useAccount();
  const { data: projects, isLoading: isLoadingProjects } = useWorkspaceProjects();
  const { data: workspace } = useWorkspace();

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Recordings', href: `/${workspaceId}/recordings`, icon: Video },
        { label: 'Links', href: `/${workspaceId}/links`, icon: LinkIcon },
      ],
    },
    {
      title: 'Projects',
      items: isLoadingProjects
        ? []
        : projects?.slice(0, 10).map((project) => ({
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
          <Badge variant="secondary" className="rounded-md text-xs">
            {workspace?.workspace.workspacePlanName || DEFAULT_PLAN_NAME}
          </Badge>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="px-6 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="text-sm font-semibold text-foreground mb-2">{section.title}</div>
              <div className="space-y-1">
                {section.title === 'Projects' && isLoadingProjects ? (
                  <div className="flex items-center gap-2 px-0 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
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
        <div className="px-6 py-4 shrink-0">
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
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-3 px-2 py-1.5">
                <BoringAvatar size={32} name={account.userName} />
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{account.userName}</div>
                  <div className="text-xs text-muted-foreground truncate">{account.userEmail}</div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/${workspaceId}/settings`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  Workspace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/${workspaceId}/accounts`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <KeyRound className="h-4 w-4" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}
