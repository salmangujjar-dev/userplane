'use client';

import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { useCallback, useState } from 'react';

import { SectionError } from '@/components/shared/section-error';
import { NotificationsSectionSkeleton } from '@/components/skeleton';
import { useDebouncedToggle } from '@/hooks/use-debounced-toggle';
import { useWorkspaceNotifications } from '@/hooks/use-workspace-notifications';
import { useUpdateNotifications } from '@/queries/use-workspace-mutations';
import { useWorkspaceId } from '@/stores/workspace';

interface WorkspaceNotifications {
  notifyOnLinkUsage: boolean;
  notifyOnQuotaReset: boolean;
  notifyOnQuotaLimit: boolean;
  notifyOnMemberJoin: boolean;
  notifyOnInviteAccepted: boolean;
}

const NOTIFICATION_ITEMS: {
  key: keyof WorkspaceNotifications;
  id: string;
  label: string;
}[] = [
  {
    key: 'notifyOnLinkUsage',
    id: 'recording-links',
    label: 'When recording links gets used',
  },
  {
    key: 'notifyOnQuotaReset',
    id: 'quota-reset',
    label: 'When workspace quota is reset',
  },
  {
    key: 'notifyOnQuotaLimit',
    id: 'quota-reached',
    label: 'When workspace quota is reached',
  },
  {
    key: 'notifyOnMemberJoin',
    id: 'someone-joins',
    label: 'When someone joins my workspace',
  },
  {
    key: 'notifyOnInviteAccepted',
    id: 'invite-accepted',
    label: 'When someone accepts my invite',
  },
];

function NotificationItem({
  label,
  id,
  initialValue,
  onToggle,
}: {
  label: string;
  id: string;
  initialValue: boolean;
  onToggle: (val: boolean) => void;
}) {
  const { value, toggle } = useDebouncedToggle(initialValue, onToggle);

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-sm font-normal cursor-pointer flex-1">
        {label}
      </Label>
      <Switch id={id} checked={value} onCheckedChange={toggle} />
    </div>
  );
}

export function NotificationsSection() {
  const currentWorkspaceId = useWorkspaceId();
  const { data: notificationsResult, isLoading, error, refetch } = useWorkspaceNotifications();
  const [syncVersion, setSyncVersion] = useState(0);

  const serverData = notificationsResult?.success
    ? notificationsResult.data.notificationPreferences
    : null;

  const updateNotificationsMutation = useUpdateNotifications({
    onError: () => {
      // Force children to re-sync from server data on error by updating the key
      setSyncVersion((v) => v + 1);
    },
  });

  const handleNotificationToggle = useCallback(
    (key: keyof WorkspaceNotifications, value: boolean) => {
      if (!currentWorkspaceId) return;

      updateNotificationsMutation.mutate({
        workspaceId: currentWorkspaceId,
        notifications: { [key]: value },
      });
    },
    [currentWorkspaceId, updateNotificationsMutation]
  );

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

  if (!serverData) {
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
        {NOTIFICATION_ITEMS.map((item) => (
          <NotificationItem
            key={`${item.key}-${syncVersion}`}
            id={item.id}
            label={item.label}
            initialValue={serverData[item.key]}
            onToggle={(val) => handleNotificationToggle(item.key, val)}
          />
        ))}
      </div>
    </div>
  );
}
