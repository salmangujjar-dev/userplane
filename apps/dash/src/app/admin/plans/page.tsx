'use client';

import { Skeleton } from '@workspace/ui/components/skeleton';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { PlanManagement } from '@/components/admin/plan-management';
import { AdminSidebar } from '@/components/navigation/admin-sidebar';
import { AdminTopActions } from '@/components/navigation/admin-top-actions';
import { useSession } from '@/features/auth';

function AdminPlansPageContent() {
  const router = useRouter();
  const { hasAdminAccess, isPending: isSessionPending } = useSession();
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  useEffect(() => {
    if (!isSessionPending && !hasAdminAccess) {
      router.replace('/');
    }
  }, [isSessionPending, hasAdminAccess, router]);

  if (isSessionPending) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 shrink-0">
          <div className="p-6">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-end gap-3 px-6 py-4" />
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopActions onCreatePlanClick={() => setShowCreateSheet(true)} />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Plans</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage DodoPayments plan products and their feature metadata
              </p>
            </div>

            <PlanManagement />
          </div>
        </main>
      </div>

      <PlanManagement.CreateSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
    </div>
  );
}

export default function AdminPlansPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-background">
          <div className="w-64 shrink-0">
            <div className="p-6">
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <AdminTopActions />
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-6" />
            </div>
          </div>
        </div>
      }
    >
      <AdminPlansPageContent />
    </Suspense>
  );
}
