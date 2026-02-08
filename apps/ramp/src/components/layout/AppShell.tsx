'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Sheet, SheetPopup } from '@/components/ui/sheet';

import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  '/expenses': { title: 'Expenses', subtitle: 'Review and manage expense submissions' },
  '/analytics': { title: 'Analytics', subtitle: 'Spending insights and trends' },
  '/employees': { title: 'Employees', subtitle: 'Team directory and spend overview' },
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const info =
    pageInfo[pathname] ??
    (pathname.startsWith('/expenses/')
      ? { title: 'Expense Detail', subtitle: 'Review expense details and receipt' }
      : { title: 'Ramp', subtitle: '' });

  return (
    <div className="flex h-dvh overflow-hidden bg-sidebar">
      {/* Desktop sidebar */}
      <div
        className="hidden md:block transition-[width] duration-200 ease-in-out overflow-hidden shrink-0"
        style={{ width: sidebarOpen ? '16rem' : '0px' }}
      >
        <AppSidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetPopup side="left" showCloseButton={false} className="w-64 p-0">
          <AppSidebar onClose={() => setMobileOpen(false)} />
        </SheetPopup>
      </Sheet>

      {/* Main content - inset panel */}
      <div className="flex flex-1 flex-col overflow-hidden md:p-2 md:pl-0">
        <div className="flex flex-1 flex-col overflow-hidden bg-background md:rounded-lg md:border md:shadow-sm">
          <AppHeader
            title={info.title}
            subtitle={info.subtitle}
            onMenuClick={() => setMobileOpen(true)}
            onToggleSidebar={toggleSidebar}
          />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
