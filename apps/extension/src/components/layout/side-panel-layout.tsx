import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { consumePendingRoute, PENDING_ROUTE_KEY } from '@/lib/storage';

import { SidePanelNav } from './side-panel-nav';

function PendingRouteHandler() {
  const navigate = useNavigate();

  // On mount: consume any pending route (handles fresh panel open)
  useEffect(() => {
    consumePendingRoute().then((path) => {
      if (path) navigate({ to: path });
    });
  }, [navigate]);

  // While open: listen for storage changes (handles already-open panel)
  useEffect(() => {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const change = changes[PENDING_ROUTE_KEY];
      if (change?.newValue) {
        navigate({ to: change.newValue });
        chrome.storage.session.remove(PENDING_ROUTE_KEY);
      }
    };
    chrome.storage.session.onChanged.addListener(listener);
    return () => chrome.storage.session.onChanged.removeListener(listener);
  }, [navigate]);

  return null;
}

export function SidePanelLayout() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <PendingRouteHandler />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <SidePanelNav />
    </div>
  );
}
