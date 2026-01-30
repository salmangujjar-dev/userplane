'use client';

import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { useCallback, useMemo, useState } from 'react';

import { SectionError } from '@/components/shared/section-error';
import { NotificationsSectionSkeleton } from '@/components/skeleton';
import {
  useUpdateNotifications,
  useWorkspaceNotifications,
  useWorkspaceRole,
} from '@/features/workspace';
import { useDebouncedToggle } from '@/hooks/use-debounced-toggle';
import { getVisibleNotificationFields } from '@/lib/notifications';
import { useWorkspaceId } from '@/stores/workspace';
import type { NotificationFieldMetadata, WorkspaceNotificationPreferences } from '@/types';

function NotificationItem({
  field,
  initialValue,
  onToggle,
}: {
  field: NotificationFieldMetadata;
  initialValue: boolean;
  onToggle: (val: boolean) => void;
}) {
  const { value, toggle } = useDebouncedToggle(initialValue, onToggle);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-1">
        <Label htmlFor={field.id} className="text-sm font-medium cursor-pointer">
          {field.label}
        </Label>
        <p className="text-sm text-muted-foreground">{field.description}</p>
      </div>
      <Switch id={field.id} checked={value} onCheckedChange={toggle} />
    </div>
  );
}

export function NotificationsSection() {
  const currentWorkspaceId = useWorkspaceId();
  const { data: notificationsResult, isLoading, error, refetch } = useWorkspaceNotifications();
  const { data: roleResult, isLoading: isLoadingRole } = useWorkspaceRole();
  const [syncVersion, setSyncVersion] = useState(0);

  const serverData = notificationsResult?.success
    ? notificationsResult.data.notificationPreferences
    : null;

  const userRole = roleResult?.success ? roleResult.data.workspaceRole : null;

  const visibleNotifications = useMemo(() => {
    if (!userRole) return [];
    return getVisibleNotificationFields(userRole);
  }, [userRole]);

  const updateNotificationsMutation = useUpdateNotifications({
    onError: () => {
      setSyncVersion((v) => v + 1);
    },
  });

  const handleNotificationToggle = useCallback(
    (key: keyof WorkspaceNotificationPreferences, value: boolean) => {
      if (!currentWorkspaceId) return;

      updateNotificationsMutation.mutate({
        workspaceId: currentWorkspaceId,
        notifications: { [key]: value },
      });
    },
    [currentWorkspaceId, updateNotificationsMutation]
  );

  if (isLoading || isLoadingRole) {
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
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Manage your email notification preferences for this workspace
        </p>
      </div>
      <div className="max-w-2xl space-y-6">
        {visibleNotifications.map((field) => (
          <NotificationItem
            key={`${field.key}-${syncVersion}`}
            field={field}
            initialValue={serverData[field.key]}
            onToggle={(val) => handleNotificationToggle(field.key, val)}
          />
        ))}
      </div>
    </div>
  );
}
