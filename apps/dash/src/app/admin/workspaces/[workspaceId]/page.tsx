'use client';

import { Card, CardContent, CardHeader } from '@userplane/ui/components/card';
import { Skeleton } from '@userplane/ui/components/skeleton';
import { redirect, RedirectType, useParams } from 'next/navigation';
import { Suspense } from 'react';

import { AdminWorkspaceTabs } from '@/components/admin/workspace-detail';
import { AdminSidebar } from '@/components/navigation/admin-sidebar';
import { AdminTopActions } from '@/components/navigation/admin-top-actions';
import { useSession } from '@/features/auth';

function WorkspaceDetailPageContent() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { hasAdminAccess, isPending: isSessionPending } = useSession();

  if (isSessionPending) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 shrink-0">
          <div className="p-6">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
          </div>
        </div>
      </div>
    );
  }

  // Redirect users without admin access
  if (!hasAdminAccess) {
    redirect('/', RedirectType.replace);
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopActions />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Workspace Overview</h2>
            <p className="text-sm text-muted-foreground">Manage workspace settings</p>
          </div>

          <AdminWorkspaceTabs workspaceId={workspaceId} isAdmin={hasAdminAccess} />
        </main>
      </div>
    </div>
  );
}

export default function WorkspaceDetailPage() {
  return (
    <Suspense fallback={<WorkspaceDetailPageSkeleton />}>
      <WorkspaceDetailPageContent />
    </Suspense>
  );
}

function WorkspaceDetailPageSkeleton() {
  return (
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
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
