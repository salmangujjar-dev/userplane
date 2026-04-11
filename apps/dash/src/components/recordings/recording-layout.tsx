'use client';

import type { ImperativePanelHandle } from '@userplane/ui/components/resizable';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@userplane/ui/components/resizable';
import { useIsTablet } from '@userplane/ui/hooks/use-mobile';
import { cn } from '@userplane/ui/lib/utils';
import { Globe, Info, MousePointerClick, Terminal } from 'lucide-react';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const PANEL_TABS = [
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-500' },
  { value: 'console', label: 'Console', icon: Terminal, color: 'text-amber-500' },
  { value: 'network', label: 'Network', icon: Globe, color: 'text-green-500' },
  { value: 'actions', label: 'Actions', icon: MousePointerClick, color: 'text-purple-500' },
] as const;

// Context to sync active tab between bookmark tabs and the panel
const PanelTabContext = createContext<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
} | null>(null);

export function usePanelTab() {
  return useContext(PanelTabContext);
}

interface RecordingLayoutProps {
  player: ReactNode;
  panel: ReactNode;
}

function PanelBookmarkTabs({ onTabClick }: { onTabClick: (tab: string) => void }) {
  return (
    <div className="fixed right-0 top-1/3 -translate-y-1/2 z-40 flex flex-col">
      {PANEL_TABS.map((tab, i) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            onClick={() => onTabClick(tab.value)}
            className={cn(
              'h-20 w-8 flex flex-col items-center gap-1.5 py-2 transition-colors rounded-l-lg rounded-r-none border border-r-0 border-border shadow-sm',
              i > 0 && '-mt-px',
              'text-muted-foreground bg-background hover:text-foreground hover:bg-accent/50'
            )}
          >
            <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-medium flex-1 flex items-center">
              {tab.label}
            </span>
            <Icon className={cn('size-3.5 shrink-0 -rotate-90', tab.color)} />
          </button>
        );
      })}
    </div>
  );
}

export function RecordingLayout({ player, panel }: RecordingLayoutProps) {
  const isTablet = useIsTablet();
  const panelRef = useRef<ImperativePanelHandle>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Reset collapsed state when returning from tablet → desktop,
  // since the desktop panel remounts expanded (fresh defaultSize).
  useEffect(() => {
    if (!isTablet) {
      setIsCollapsed(false);
    }
  }, [isTablet]);

  const togglePanel = useCallback(() => {
    const ref = panelRef.current;
    if (!ref) return;
    if (ref.isCollapsed()) {
      ref.resize(34);
    } else {
      ref.collapse();
    }
  }, []);

  const handleBookmarkTabClick = useCallback((tab: string) => {
    setActiveTab(tab);
    const ref = panelRef.current;
    if (ref?.isCollapsed()) {
      ref.resize(34);
    }
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + ]
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        togglePanel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel]);

  const tabContext = { activeTab, setActiveTab };

  // Tablet & phone (< 1024px): vertical top-bottom split
  if (isTablet) {
    return (
      <PanelTabContext.Provider value={tabContext}>
        <main className="w-full px-4 overflow-hidden flex-1">
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={45} minSize={25}>
              <div className="relative h-full pb-1">{player}</div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={55} minSize={25}>
              <div className="h-full pt-1">{panel}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </PanelTabContext.Provider>
    );
  }

  // Desktop (>= 1024px): resizable + collapsible panel
  return (
    <PanelTabContext.Provider value={tabContext}>
      <main className="w-full px-4 overflow-hidden flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg overflow-hidden">
          <ResizablePanel defaultSize={66} minSize={30} className="overflow-x-visible">
            <div className="relative pr-4 h-full">{player}</div>
          </ResizablePanel>

          <ResizableHandle
            withHandle={!isCollapsed}
            className={isCollapsed ? 'w-0 border-0 overflow-hidden pointer-events-none' : undefined}
          />

          <ResizablePanel
            ref={panelRef}
            defaultSize={34}
            minSize={25}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsCollapsed(true)}
            onExpand={() => setIsCollapsed(false)}
            className="overflow-hidden"
          >
            <div className="px-4 h-full">{panel}</div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {isCollapsed && <PanelBookmarkTabs onTabClick={handleBookmarkTabClick} />}
      </main>
    </PanelTabContext.Provider>
  );
}
