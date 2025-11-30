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
import Avatar from 'boring-avatars';
import { Video, Link as LinkIcon, Settings, FolderKanban, KeyRound, LogOut } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace';

interface SidebarProps {
  workspaceName: string;
  planName: string;
  userEmail?: string;
  userName?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ planName, userEmail, userName }: SidebarProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Recordings', href: `/${workspaceId}`, icon: Video },
        { label: 'Shared Links', href: `/${workspaceId}/links`, icon: LinkIcon },
      ],
    },
    {
      title: 'Projects',
      items: [
        { label: 'Project 1', href: `/${workspaceId}/projects/1`, icon: FolderKanban },
        { label: 'Project 2', href: `/${workspaceId}/projects/2`, icon: FolderKanban },
        { label: 'Project 3', href: `/${workspaceId}/projects/3`, icon: FolderKanban },
      ],
    },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col flex-shrink-0 bg-background">
      <div className="px-6 py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/${workspaceId}`}>
            <Logo size="sm" />
          </Link>
          <Badge variant="secondary" className="rounded-md text-xs">
            {planName}
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

      {userName && (
        <div className="px-6 py-4 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:bg-accent rounded-lg transition-colors w-full p-2">
                <Avatar
                  size={32}
                  name={userName}
                  variant="beam"
                  colors={['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']}
                />
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{userName}</div>
                  {userEmail && (
                    <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col gap-1 px-2 py-1.5">
                <div className="text-sm font-semibold">{userName}</div>
                <div className="text-xs text-muted-foreground">{userEmail}</div>
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
                <Link href="/accounts" className="flex items-center gap-2 cursor-pointer">
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
