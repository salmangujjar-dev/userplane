import { Outlet } from '@tanstack/react-router';

import { SidePanelNav } from './side-panel-nav';

export function SidePanelLayout() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <SidePanelNav />
    </div>
  );
}
