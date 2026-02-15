'use client';

import { Button } from '@workspace/ui/components/button';
import { toast } from '@workspace/ui/components/sonner';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { ClearCacheModal } from '@/components/modals/clear-cache-modal';
import { PageHeader } from '@/components/navigation/page-header';
import { useClearClientCache, useClearServerCache } from '@/hooks/use-diagnostics';
import type { CacheType } from '@/types';

export default function DiagnosticsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  const clearServerCache = useClearServerCache();
  const clearClientCache = useClearClientCache();

  const handleClearServerCache = (types: CacheType[]) => {
    const promise = clearServerCache.mutateAsync({ workspaceId, types });
    toast.promise(promise, {
      loading: 'Clearing server cache...',
      success: 'Server cache cleared successfully',
      error: 'Failed to clear server cache',
    });
    promise.finally(() => setShowClearCacheModal(false)).catch(() => {});
  };

  const handleClearClientCache = () => {
    toast.promise(clearClientCache.mutateAsync(), {
      loading: 'Clearing client cache...',
      success: 'Client cache cleared successfully',
      error: 'Failed to clear client cache',
    });
  };

  return (
    <>
      <PageHeader title="Diagnostics" description="Workspace diagnostics and maintenance tools" />

      <main className="flex-1 overflow-y-auto px-6 pb-8">
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

      <ClearCacheModal
        open={showClearCacheModal}
        onOpenChange={setShowClearCacheModal}
        onConfirm={handleClearServerCache}
        isLoading={clearServerCache.isPending}
      />
    </>
  );
}
