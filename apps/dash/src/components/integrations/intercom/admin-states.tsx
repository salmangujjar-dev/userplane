'use client';

import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useRouter } from 'next/navigation';

import { IntercomInviteLayout } from './intercom-invite-layout';

const ITEMS_PER_PAGE = 5;

/**
 * Loading state shown while fetching Intercom admins.
 */
export function AdminsLoadingState() {
  return (
    <IntercomInviteLayout
      title="Invite your teammates"
      description="Select team members from Intercom to invite to your workspace"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>

        <div className="border rounded-lg divide-y">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-full" />
        <div className="flex justify-center">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </IntercomInviteLayout>
  );
}

interface AdminsEmptyStateProps {
  workspaceId: string;
}

/**
 * Empty state shown when all Intercom teammates are already workspace members.
 */
export function AdminsEmptyState({ workspaceId }: AdminsEmptyStateProps) {
  const router = useRouter();

  return (
    <IntercomInviteLayout
      title="All teammates invited"
      description="All your Intercom team members are already part of this workspace."
    >
      <div className="space-y-4">
        <Button
          onClick={() => router.push(`/${workspaceId}/settings`)}
          size="lg"
          className="w-full rounded-full px-7 py-6"
        >
          Go to Settings
        </Button>
      </div>
    </IntercomInviteLayout>
  );
}

interface AdminsErrorStateProps {
  workspaceId: string;
  message: string;
  onRetry: () => void;
}

/**
 * Error state shown when fetching Intercom admins fails.
 */
export function AdminsErrorState({ workspaceId, message, onRetry }: AdminsErrorStateProps) {
  const router = useRouter();

  return (
    <IntercomInviteLayout title="Failed to load teammates" description={message}>
      <div className="space-y-4">
        <Button onClick={onRetry} size="lg" className="w-full rounded-full px-7 py-6">
          Try Again
        </Button>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => router.push(`/${workspaceId}/settings`)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </IntercomInviteLayout>
  );
}
