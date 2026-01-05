'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import { useWorkspaceId } from '@/stores/workspace';
import { useWorkspaceNotifications } from '@/hooks/use-workspace-notifications';
import { useUpdateNotifications } from '@/queries/use-workspace-mutations';
import { SectionError } from '@/components/shared/section-error';
import { NotificationsSectionSkeleton } from '@/components/skeleton';

interface WorkspaceNotifications {
  notifyOnLinkUsage: boolean;
  notifyOnQuotaReset: boolean;
  notifyOnQuotaLimit: boolean;
  notifyOnMemberJoin: boolean;
  notifyOnInviteAccepted: boolean;
}

export function NotificationsSection() {
  const currentWorkspaceId = useWorkspaceId();
  const { data: notificationsResult, isLoading, error, refetch } = useWorkspaceNotifications();

  const serverData = notificationsResult?.success
    ? notificationsResult.data.notificationPreferences
    : null;

  const [localState, setLocalState] = useState<WorkspaceNotifications | null>(null);
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({});
  const shouldSyncRef = useRef(true);

  const updateNotificationsMutation = useUpdateNotifications({
    onError: () => {
      // Allow re-sync from server on next data change
      shouldSyncRef.current = true;
    },
  });

  // Sync local state with server data only when allowed
  // Initially true, then false after first sync, reset to true on error
  useEffect(() => {
    if (serverData && shouldSyncRef.current) {
      setLocalState(serverData);
      shouldSyncRef.current = false;
    }
  }, [serverData]);

  useEffect(() => {
    const timers = debounceTimerRef.current;
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleNotificationToggle = useCallback(
    (key: keyof WorkspaceNotifications, value: boolean) => {
      if (!currentWorkspaceId) return;

      // Immediate local state update for optimistic UI
      setLocalState((prev) => (prev ? { ...prev, [key]: value } : prev));

      // Clear existing timer for this key
      if (debounceTimerRef.current[key]) {
        clearTimeout(debounceTimerRef.current[key]);
      }

      // Debounce the API call
      debounceTimerRef.current[key] = setTimeout(() => {
        updateNotificationsMutation.mutate({
          workspaceId: currentWorkspaceId,
          notifications: { [key]: value },
        });
        delete debounceTimerRef.current[key];
      }, 500);
    },
    [currentWorkspaceId, updateNotificationsMutation]
  );

  // Use local state for display (optimistic), fall back to server data
  const notificationsData = localState ?? serverData;

  if (isLoading) {
    return <NotificationsSectionSkeleton />;
  }

  if (error || (notificationsResult && !notificationsResult.success)) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Notification</h2>
          <p className="text-sm text-muted-foreground">Configure your workspace notifications</p>
        </div>
        <div className="max-w-2xl">
          <SectionError
            title="Failed to load notifications"
            description={
              error instanceof Error
                ? error.message
                : notificationsResult && !notificationsResult.success
                  ? notificationsResult.error.message
                  : 'Something went wrong while loading notification settings.'
            }
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  if (!notificationsData) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Notification</h2>
          <p className="text-sm text-muted-foreground">Configure your workspace notifications</p>
        </div>
        <div className="max-w-2xl">
          <p className="text-sm text-muted-foreground">No notification preferences found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Notification</h2>
        <p className="text-sm text-muted-foreground">Configure your workspace notifications</p>
      </div>
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="recording-links" className="text-sm font-normal cursor-pointer flex-1">
            When recording links gets used
          </Label>
          <Switch
            id="recording-links"
            checked={notificationsData.notifyOnLinkUsage}
            onCheckedChange={(checked) => handleNotificationToggle('notifyOnLinkUsage', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="quota-reset" className="text-sm font-normal cursor-pointer flex-1">
            When workspace quota is reset
          </Label>
          <Switch
            id="quota-reset"
            checked={notificationsData.notifyOnQuotaReset}
            onCheckedChange={(checked) => handleNotificationToggle('notifyOnQuotaReset', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="quota-reached" className="text-sm font-normal cursor-pointer flex-1">
            When workspace quota is reached
          </Label>
          <Switch
            id="quota-reached"
            checked={notificationsData.notifyOnQuotaLimit}
            onCheckedChange={(checked) => handleNotificationToggle('notifyOnQuotaLimit', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="someone-joins" className="text-sm font-normal cursor-pointer flex-1">
            When someone joins my workspace
          </Label>
          <Switch
            id="someone-joins"
            checked={notificationsData.notifyOnMemberJoin}
            onCheckedChange={(checked) => handleNotificationToggle('notifyOnMemberJoin', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="invite-accepted" className="text-sm font-normal cursor-pointer flex-1">
            When someone accepts my invite
          </Label>
          <Switch
            id="invite-accepted"
            checked={notificationsData.notifyOnInviteAccepted}
            onCheckedChange={(checked) =>
              handleNotificationToggle('notifyOnInviteAccepted', checked)
            }
          />
        </div>
      </div>
    </div>
  );
}
