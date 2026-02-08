'use client';

import { MenuIcon, PanelLeftIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onToggleSidebar?: () => void;
}

export function AppHeader({ title, subtitle, onMenuClick, onToggleSidebar }: AppHeaderProps) {
  return (
    <header className="flex flex-col justify-center border-b px-4 py-4 md:px-6 md:py-5">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <MenuIcon />
          </Button>
        )}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex size-7"
            onClick={onToggleSidebar}
          >
            <PanelLeftIcon className="size-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        )}
        {(onMenuClick || onToggleSidebar) && (
          <Separator orientation="vertical" className="hidden md:block h-5" />
        )}
        <div className="space-y-0.5">
          <h1 className="font-semibold text-lg leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
