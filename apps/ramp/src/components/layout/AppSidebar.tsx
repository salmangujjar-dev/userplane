'use client';

import BoringAvatar from 'boring-avatars';
import {
  BarChart3Icon,
  ChevronsUpDownIcon,
  LogOutIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu';
import { toastManager } from '@/components/ui/toast';
import { useExpenses } from '@/hooks/useExpenses';
import { authClient } from '@/lib/auth-client';
import { isFailureActive } from '@/lib/feature-flags';
import { cn } from '@/lib/utils';

const AVATAR_COLORS = ['#1F1F1F', '#E4F222', '#737373', '#A3A3A3', '#D4D4D4'];

const navItems = [
  { href: '/expenses', label: 'Expenses', icon: ReceiptTextIcon },
  { href: '/employees', label: 'Employees', icon: UsersIcon },
  { href: '/analytics', label: 'Analytics', icon: BarChart3Icon },
];

export function AppSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { expenses } = useExpenses({ status: 'pending' });
  const pendingCount = expenses.length;
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name ?? 'User';
  const userEmail = session?.user?.email ?? '';

  const handleSignOut = async () => {
    if (isFailureActive('signOut')) {
      console.error('[Auth] Session service is temporarily unavailable — sign out failed');
      toastManager.add({
        title: 'Unable to sign out',
        description: 'Session service is temporarily unavailable. Please try again later.',
        type: 'error',
      });
      return;
    }
    await authClient.signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/expenses" className="flex items-center gap-2">
          <Image src="/media/Ramp_idxW_Yq9Eu_1.svg" alt="Ramp" width={80} height={22} priority />
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <XIcon />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="size-4" />
              {item.label}
              {item.label === 'Expenses' && pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  size="sm"
                  className="ml-auto bg-accent text-accent-foreground font-semibold"
                >
                  {pendingCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Account section */}
      <div className="p-3">
        <Menu>
          <MenuTrigger
            nativeButton={false}
            className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            render={<div />}
          >
            <div className="shrink-0 rounded-full">
              <BoringAvatar size={32} name={userName} variant="beam" colors={AVATAR_COLORS} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium leading-tight truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/50 leading-tight truncate">
                {userEmail}
              </p>
            </div>
            <ChevronsUpDownIcon className="size-4 text-sidebar-foreground/30 shrink-0" />
          </MenuTrigger>
          <MenuPopup
            align="start"
            side="top"
            sideOffset={8}
            className="w-[calc(var(--anchor-width)+0.5rem)]"
          >
            <MenuItem onClick={() => router.push('/settings')}>
              <SettingsIcon /> Settings
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <LogOutIcon /> Log out
            </MenuItem>
          </MenuPopup>
        </Menu>
      </div>
    </div>
  );
}
