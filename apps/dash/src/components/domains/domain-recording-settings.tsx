import type { FeatureGate } from '@userplane/pricing';
import { Label } from '@userplane/ui/components/label';
import { Switch } from '@userplane/ui/components/switch';
import { cn } from '@userplane/ui/lib/utils';

import { useSubscriptionStatus } from '@/features/billing';
import { useFeatureUpsell } from '@/hooks/use-feature-upsell';
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
    featureKey: FeatureGate
  ) => {
    const gated = !featureGates?.[featureKey];
    const isInteractive = gated && !disabled;
    return (
      <div
        className={cn('flex items-center justify-between', isInteractive && 'cursor-pointer')}
        {...(isInteractive
          ? {
              role: 'button' as const,
              tabIndex: 0,
              onClick: () => triggerUpsell(featureKey),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerUpsell(featureKey);
                }
              },
            }
          : {})}
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
          'captureConsoleLog'
        )}

        {gatedToggle(
          `${idPrefix}-client-actions`,
          'Capture client actions',
          settings.recordingCaptureClientAction,
          (checked) => updateSetting('recordingCaptureClientAction', checked),
          'captureUserActions'
        )}

        {gatedToggle(
          `${idPrefix}-network-logs`,
          'Capture network logs',
          settings.recordingCaptureNetworkLog,
          (checked) => updateSetting('recordingCaptureNetworkLog', checked),
          'captureNetworkActivity'
        )}

        {gatedToggle(
          `${idPrefix}-backend-server`,
          'Capture backend and server logs',
          settings.recordingCaptureServerLog,
          (checked) => updateSetting('recordingCaptureServerLog', checked),
          'captureServerLogs'
        )}
      </div>
    </div>
  );
}
