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
  Building2,
  ChevronsUpDown,
  HelpCircle,
  LogOut,
  Settings2,
  Shield,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { BoringAvatar } from '@/components/shared/boring-avatar';
import { useAccount } from '@/features/account';
import { useWorkspaces } from '@/features/workspace';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspaceStore } from '@/stores/workspace';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: 'Administration',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
    ],
  },
];

export function AdminSidebar() {
  const router = useRouter();
  const { data: accountResult } = useAccount();
  const { data: workspacesResult } = useWorkspaces({
    page: 1,
    perPage: 20,
    includeWorkspaceMembership: false,
  });
  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);
  const { signOut } = useAuth();

  const account = accountResult?.success ? accountResult.data : null;
  const workspacesData = workspacesResult?.success ? workspacesResult.data : null;

  return (
    <aside className="flex h-screen w-64 flex-col shrink-0 bg-background">
      <div className="px-6 py-6 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Logo size="sm" />
          </Link>
          <Badge variant="secondary" className="rounded-md text-xs">
            Admin
          </Badge>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="px-6 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="text-sm font-semibold text-foreground mb-2">{section.title}</div>
              <div className="space-y-1">
                {section.items.map((item) => {
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
                })}
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
                        Go to Workspace
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
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm flex-1 truncate">{ws.workspaceName}</span>
                        </button>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <DropdownMenuSeparator className="-mx-2 my-2" />
              <Link
                href="/admin"
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
              <Link
                href="/account"
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium"
              >
                <Settings2 className="h-4 w-4" />
                Account
              </Link>
              <DropdownMenuSeparator className="-mx-2 my-2" />
              <a
                href="https://docs.userplane.io"
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
    </aside>
  );
}
