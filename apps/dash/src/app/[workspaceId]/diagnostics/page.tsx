'use client';

import type { CacheType } from '@workspace/contract';
import { Button } from '@workspace/ui/components/button';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { ClearCacheModal } from '@/components/modals/clear-cache-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { useClearClientCache, useClearServerCache } from '@/hooks/use-diagnostics';

export default function DiagnosticsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  const clearServerCache = useClearServerCache();
  const clearClientCache = useClearClientCache();

  const handleClearServerCache = (types: CacheType[]) => {
    clearServerCache.mutate(
      { workspaceId, types },
      {
        onSettled: () => setShowClearCacheModal(false),
      }
    );
  };

  const handleClearClientCache = () => {
    clearClientCache.mutate();
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 h-16" />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Diagnostics</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Workspace diagnostics and maintenance tools
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Clear Server Cache</h3>
                <p className="text-sm text-muted-foreground">
                  Clear cache including billing, subscription, entitlements, and link data
                </p>
              </div>
              <Button
                onClick={() => setShowClearCacheModal(true)}
                disabled={clearServerCache.isPending}
                variant="outline"
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Clear Client Cache</h3>
                <p className="text-sm text-muted-foreground">
                  Clear client-side cache, query cache and reset local data
                </p>
              </div>
              <Button
                onClick={handleClearClientCache}
                disabled={clearClientCache.isPending}
                variant="outline"
              >
                {clearClientCache.isPending ? 'Clearing...' : 'Clear'}
              </Button>
            </div>
          </div>
        </main>
      </div>

      <ClearCacheModal
        open={showClearCacheModal}
        onOpenChange={setShowClearCacheModal}
        onConfirm={handleClearServerCache}
        isLoading={clearServerCache.isPending}
      />
    </div>
  );
}
