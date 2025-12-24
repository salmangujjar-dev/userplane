'use client';

import { useMemo } from 'react';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useWorkspaceId } from '@/stores/workspace';
import { useUpdateNotifications } from '@/queries/use-workspace-mutations';
import { SectionError } from '@/components/shared/section-error';

interface WorkspaceNotifications {
  notifyOnLinkUsage: boolean;
  notifyOnQuotaReset: boolean;
  notifyOnQuotaLimit: boolean;
  notifyOnMemberJoin: boolean;
  notifyOnInviteAccepted: boolean;
}

export function NotificationsSection() {
  const currentWorkspaceId = useWorkspaceId();
  const {
    data: workspacesData,
    isLoading,
    error,
    refetch,
  } = useWorkspaces({
    page: 1,
    perPage: 100,
  });

  const updateNotificationsMutation = useUpdateNotifications();

  const notifications = useMemo<WorkspaceNotifications | null>(() => {
    if (!workspacesData?.workspaces || !currentWorkspaceId) return null;

    const currentWorkspace = workspacesData.workspaces.find(
      (ws) => ws.workspaceId === currentWorkspaceId
    );

    if (!currentWorkspace) return null;

    return {
      notifyOnLinkUsage: currentWorkspace.notificationPreferences?.notifyOnLinkUsage ?? false,
      notifyOnQuotaReset: currentWorkspace.notificationPreferences?.notifyOnQuotaReset ?? false,
      notifyOnQuotaLimit: currentWorkspace.notificationPreferences?.notifyOnQuotaLimit ?? false,
      notifyOnMemberJoin: currentWorkspace.notificationPreferences?.notifyOnMemberJoin ?? false,
      notifyOnInviteAccepted:
        currentWorkspace.notificationPreferences?.notifyOnInviteAccepted ?? false,
    };
  }, [workspacesData, currentWorkspaceId]);

  const handleNotificationToggle = (key: keyof WorkspaceNotifications, value: boolean) => {
    if (!currentWorkspaceId) return;

    updateNotificationsMutation.mutate({
      workspaceId: currentWorkspaceId,
      notifications: { [key]: value },
    });
  };

  if (error) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Notification</h2>
          <p className="text-sm text-muted-foreground">Configure your workspace notifications</p>
        </div>
        <div className="max-w-md">
          <SectionError
            title="Failed to load notifications"
            description={
              error instanceof Error
                ? error.message
                : 'Something went wrong while loading notification settings.'
            }
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Notification</h2>
          <p className="text-sm text-muted-foreground">Configure your workspace notifications</p>
        </div>
        <div className="max-w-md space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              <div className="h-6 w-12 bg-muted animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!notifications) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Notification</h2>
          <p className="text-sm text-muted-foreground">Configure your workspace notifications</p>
        </div>
        <div className="max-w-md">
          <p className="text-sm text-muted-foreground">No workspace found.</p>
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
      <div className="max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="recording-links" className="text-sm font-normal cursor-pointer flex-1">
            When recording links gets used
          </Label>
          <Switch
            id="recording-links"
            checked={notifications.notifyOnLinkUsage}
            onCheckedChange={(checked) => handleNotificationToggle('notifyOnLinkUsage', checked)}
            disabled={updateNotificationsMutation.isPending}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="quota-reset" className="text-sm font-normal cursor-pointer flex-1">
            When workspace quota is reset
          </Label>
          <Switch
            id="quota-reset"
            checked={notifications.notifyOnQuotaReset}
            onCheckedChange={(checked) => handleNotificationToggle('notifyOnQuotaReset', checked)}
            disabled={updateNotificationsMutation.isPending}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="quota-reached" className="text-sm font-normal cursor-pointer flex-1">
            When workspace quota is reached
          </Label>
          <Switch
            id="quota-reached"
            checked={notifications.notifyOnQuotaLimit}
            onCheckedChange={(checked) => handleNotificationToggle('notifyOnQuotaLimit', checked)}
            disabled={updateNotificationsMutation.isPending}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="someone-joins" className="text-sm font-normal cursor-pointer flex-1">
            When someone joins my workspace
          </Label>
          <Switch
            id="someone-joins"
            checked={notifications.notifyOnMemberJoin}
            onCheckedChange={(checked) => handleNotificationToggle('notifyOnMemberJoin', checked)}
            disabled={updateNotificationsMutation.isPending}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="invite-accepted" className="text-sm font-normal cursor-pointer flex-1">
            When someone accepts my invite
          </Label>
          <Switch
            id="invite-accepted"
            checked={notifications.notifyOnInviteAccepted}
            onCheckedChange={(checked) =>
              handleNotificationToggle('notifyOnInviteAccepted', checked)
            }
            disabled={updateNotificationsMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
