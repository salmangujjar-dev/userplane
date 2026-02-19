import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { cn } from '@workspace/ui/lib/utils';

import { useSubscriptionStatus } from '@/features/billing';
import { useFeatureUpsell } from '@/hooks/use-feature-upsell';
import type { UpsellFeatureKey } from '@/lib/upsell-config';
import type { DomainRecordingPreferences } from '@/types/domain';

interface DomainRecordingSettingsProps {
  settings: DomainRecordingPreferences;
  onSettingsChange: (settings: DomainRecordingPreferences) => void;
  disabled?: boolean;
  idPrefix?: string;
  hideHideSensitiveField?: boolean;
}

export function DomainRecordingSettings({
  settings,
  onSettingsChange,
  disabled = false,
  idPrefix = 'domain',
  hideHideSensitiveField = false,
}: DomainRecordingSettingsProps) {
  const { data: subscriptionResult } = useSubscriptionStatus();
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const featureGates = subscriptionData?.featureGates;
  const { triggerUpsell } = useFeatureUpsell();

  const updateSetting = <K extends keyof DomainRecordingPreferences>(
    key: K,
    value: DomainRecordingPreferences[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const gatedToggle = (
    id: string,
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
    featureKey: UpsellFeatureKey
  ) => {
    const gated = !featureGates?.[featureKey];
    return (
      <div
        className={cn('flex items-center justify-between', gated && !disabled && 'cursor-pointer')}
        onClick={gated && !disabled ? () => triggerUpsell(featureKey) : undefined}
      >
        <Label
          htmlFor={!gated ? id : undefined}
          className={cn(
            'text-sm font-normal flex-1',
            disabled || gated ? 'text-muted-foreground' : 'cursor-pointer',
            gated && !disabled && 'cursor-pointer'
          )}
        >
          {label}
        </Label>
        <span className={cn(gated && 'pointer-events-none')}>
          <Switch
            id={id}
            checked={checked}
            onCheckedChange={onChange}
            disabled={disabled || gated}
          />
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Recording Settings</div>

      <div className="space-y-4 pl-1">
        {!hideHideSensitiveField && (
          <div className="flex items-center justify-between">
            <Label
              htmlFor={`${idPrefix}-hide-sensitive`}
              className={cn(
                'text-sm font-normal flex-1',
                disabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'
              )}
            >
              Hide sensitive fields
            </Label>
            <Switch
              id={`${idPrefix}-hide-sensitive`}
              checked={settings.recordingHideSensitive}
              onCheckedChange={(checked) => updateSetting('recordingHideSensitive', checked)}
              disabled={disabled}
            />
          </div>
        )}

        {gatedToggle(
          `${idPrefix}-console-logs`,
          'Capture console logs',
          settings.recordingCaptureClientLog,
          (checked) => updateSetting('recordingCaptureClientLog', checked),
          'requestConsoleLogs'
        )}

        {gatedToggle(
          `${idPrefix}-client-actions`,
          'Capture client actions',
          settings.recordingCaptureClientAction,
          (checked) => updateSetting('recordingCaptureClientAction', checked),
          'requestActionReplay'
        )}

        {gatedToggle(
          `${idPrefix}-network-logs`,
          'Capture network logs',
          settings.recordingCaptureNetworkLog,
          (checked) => updateSetting('recordingCaptureNetworkLog', checked),
          'requestNetworkActivity'
        )}

        {gatedToggle(
          `${idPrefix}-backend-server`,
          'Capture backend and server logs',
          settings.recordingCaptureServerLog,
          (checked) => updateSetting('recordingCaptureServerLog', checked),
          'requestServerLogs'
        )}
      </div>
    </div>
  );
}
