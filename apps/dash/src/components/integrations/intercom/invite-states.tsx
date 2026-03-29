'use client';

import { Button } from '@userplane/ui/components/button';
import { Skeleton } from '@userplane/ui/components/skeleton';
import { useRouter } from 'next/navigation';

import { IntercomInviteLayout } from './intercom-invite-layout';
import { SlackInviteHeader } from './slack-invite-header';

/** Provider variants supported by the invite states */
type InviteVariant = 'intercom' | 'slack';

const ITEMS_PER_PAGE = 6;

/**
 * Loading state shown while fetching teammates data.
 * Skeleton matches the actual InviteTeammatesView structure to prevent layout shifts.
 */
export function InviteLoadingState({ variant = 'intercom' }: { variant?: InviteVariant }) {
  const header = variant === 'slack' ? <SlackInviteHeader /> : undefined;

  return (
    <IntercomInviteLayout
      title="Invite your teammates"
      description="Select team members to invite to your workspace"
      header={header}
    >
      {/* Tabs skeleton */}
      <div className="w-full">
        <div className="w-full grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </div>

        {/* Fixed height container matching actual view */}
        <div className="h-[380px] mt-4 flex flex-col">
          {/* Header with select all */}
          <div className="flex items-center justify-between px-1 mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Teammates list */}
          <div className="divide-y flex-1 overflow-hidden">
            {Array.from({ length: ITEMS_PER_PAGE }, (_, i) => `teammate-skeleton-${i}`).map(
              (id) => (
                <div key={id} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              )
            )}
          </div>

          {/* Email input skeleton at bottom */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-md" />
        <div className="flex justify-center">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </IntercomInviteLayout>
  );
}

const EMPTY_STATE_DESCRIPTIONS: Record<InviteVariant, string> = {
  intercom: 'All your Intercom team members are already part of this workspace.',
  slack: 'All your Slack workspace members are already part of this workspace.',
};

interface InviteEmptyStateProps {
  workspaceId: string;
  variant?: InviteVariant;
}

/**
 * Empty state shown when all teammates are already workspace members.
 */
export function InviteEmptyState({ workspaceId, variant = 'intercom' }: InviteEmptyStateProps) {
  const router = useRouter();
  const header = variant === 'slack' ? <SlackInviteHeader /> : undefined;

  return (
    <IntercomInviteLayout
      title="All teammates invited"
      description={EMPTY_STATE_DESCRIPTIONS[variant]}
      header={header}
    >
      <div className="space-y-4">
        <Button
          onClick={() => router.push(`/workspace/${workspaceId}/settings`)}
          size="lg"
          className="w-full px-7 py-6"
        >
          Go to Settings
        </Button>
      </div>
    </IntercomInviteLayout>
  );
}

interface InviteErrorStateProps {
  workspaceId: string;
  message: string;
  onRetry: () => void;
  variant?: InviteVariant;
}

/**
 * Error state shown when fetching teammates fails.
 */
export function InviteErrorState({
  workspaceId,
  message,
  onRetry,
  variant = 'intercom',
}: InviteErrorStateProps) {
  const router = useRouter();
  const header = variant === 'slack' ? <SlackInviteHeader /> : undefined;

  return (
    <IntercomInviteLayout title="Failed to load teammates" description={message} header={header}>
      <div className="space-y-4">
        <Button onClick={onRetry} size="lg" className="w-full px-7 py-6">
          Try Again
        </Button>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => router.push(`/workspace/${workspaceId}/recordings`)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </IntercomInviteLayout>
  );
}
