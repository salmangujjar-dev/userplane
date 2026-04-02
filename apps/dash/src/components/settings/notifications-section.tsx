'use client';

import { Label } from '@userplane/ui/components/label';
import { Switch } from '@userplane/ui/components/switch';
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
import type { IncomingEventChannels, NotificationFieldMetadata } from '@/types';

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

function ChannelToggle({
  id,
  label,
  description,
  initialValue,
  onToggle,
}: {
  id: string;
  label: string;
  description: string;
  initialValue: boolean;
  onToggle: (val: boolean) => void;
}) {
  const { value, toggle } = useDebouncedToggle(initialValue, onToggle);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-1">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={value} onCheckedChange={toggle} />
    </div>
  );
}

const CHANNEL_METADATA: Record<string, { label: string; description: string }> = {
  email: {
    label: 'Email notifications for recordings',
    description: 'Receive an email when new recordings arrive',
  },
  slack: {
    label: 'Slack notifications for recordings',
    description: 'Receive a Slack DM when new recordings arrive',
  },
  intercom: {
    label: 'Intercom notifications for recordings',
    description: 'Post a note to the Intercom conversation when new recordings arrive',
  },
  zendesk: {
    label: 'Zendesk notifications for recordings',
    description: 'Post a note to the Zendesk ticket when new recordings arrive',
  },
};

export function NotificationsSection() {
  const currentWorkspaceId = useWorkspaceId();
  const { data: notificationsResult, isLoading, error, refetch } = useWorkspaceNotifications();
  const { data: roleResult, isLoading: isLoadingRole } = useWorkspaceRole();
  const [syncVersion, setSyncVersion] = useState(0);

  const serverData = notificationsResult?.success
    ? notificationsResult.data.notificationPreferences
    : null;

  const availableChannels = notificationsResult?.success
    ? notificationsResult.data.availableChannels
    : [];

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

  const handleBooleanToggle = useCallback(
    (
      key: 'notifyFeatureHighlights' | 'notifyUsageEvents' | 'notifyAdminEvents',
      value: boolean
    ) => {
      if (!currentWorkspaceId) return;

      updateNotificationsMutation.mutate({
        workspaceId: currentWorkspaceId,
        notifications: { [key]: value },
      });
    },
    [currentWorkspaceId, updateNotificationsMutation]
  );

  const handleChannelToggle = useCallback(
    (channel: keyof IncomingEventChannels, value: boolean) => {
      if (!currentWorkspaceId) return;

      updateNotificationsMutation.mutate({
        workspaceId: currentWorkspaceId,
        notifications: { notifyIncomingEvents: { [channel]: value } },
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

  // notifyIncomingEvents is a JSONB channel map
  const incomingChannels =
    typeof serverData.notifyIncomingEvents === 'object' && serverData.notifyIncomingEvents !== null
      ? (serverData.notifyIncomingEvents as IncomingEventChannels)
      : { email: false };

  // Channels to render: always email, plus any available integrations
  const visibleChannels = ['email', ...availableChannels.filter((c) => c !== 'email')];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Manage your notification preferences for this workspace
        </p>
      </div>
      <div className="max-w-2xl space-y-8">
        <div className="space-y-6">
          {visibleNotifications.map((field) => (
            <NotificationItem
              key={`${field.key}-${syncVersion}`}
              field={field}
              initialValue={serverData[field.key] as boolean}
              onToggle={(val) => handleBooleanToggle(field.key, val)}
            />
          ))}

          {visibleChannels.map((channel) => {
            const meta = CHANNEL_METADATA[channel];
            if (!meta) return null;
            return (
              <ChannelToggle
                key={`incoming-${channel}-${syncVersion}`}
                id={`incoming-${channel}`}
                label={meta.label}
                description={meta.description}
                initialValue={
                  (incomingChannels as Record<string, boolean | undefined>)[channel] ?? false
                }
                onToggle={(val) => handleChannelToggle(channel as keyof IncomingEventChannels, val)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
