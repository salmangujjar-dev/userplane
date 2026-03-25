import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { consumePendingRoute, PENDING_ROUTE_KEY } from '@/lib/storage';

import { SidePanelNav } from './side-panel-nav';

type WindowScopedValue<T> = {
  value: T;
  windowId: number;
};

async function getCurrentWindowId(): Promise<number | null> {
  try {
    const currentWindow = await chrome.windows.getCurrent();
    return currentWindow.id ?? null;
  } catch {
    return null;
  }
}

function PendingRouteHandler() {
  const navigate = useNavigate();

  // On mount: consume any pending route (handles fresh panel open)
  useEffect(() => {
    getCurrentWindowId().then((windowId) => {
      if (windowId == null) return;

      consumePendingRoute(windowId).then((path) => {
        if (path) navigate({ to: path });
      });
    });
  }, [navigate]);

  // While open: listen for storage changes (handles already-open panel)
  useEffect(() => {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const change = changes[PENDING_ROUTE_KEY];
      const payload = change?.newValue as WindowScopedValue<string> | string | undefined;
      if (!payload) return;

      void getCurrentWindowId().then((windowId) => {
        if (windowId == null) return;

        const path =
          typeof payload === 'string'
            ? payload
            : payload.windowId === windowId
              ? payload.value
              : null;

        if (!path) return;

        navigate({ to: path });
        chrome.storage.session.remove(PENDING_ROUTE_KEY);
      });
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
