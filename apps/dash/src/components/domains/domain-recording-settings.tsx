import { getFeatureGates, type PlanId } from '@workspace/pricing';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { AlertCircle } from 'lucide-react';

import { useSubscriptionStatus } from '@/features/billing';
import type { DomainRecordingPreferences } from '@/types/domain';

interface DomainRecordingSettingsProps {
  settings: DomainRecordingPreferences;
  onSettingsChange: (settings: DomainRecordingPreferences) => void;
  disabled?: boolean;
  idPrefix?: string;
}

export function DomainRecordingSettings({
  settings,
  onSettingsChange,
  disabled = false,
  idPrefix = 'domain',
}: DomainRecordingSettingsProps) {
  const { data: subscriptionResult } = useSubscriptionStatus();
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const effectivePlanId = (subscriptionData?.accessDetail.effectivePlanId ?? 'free') as PlanId;
  const featureGates = getFeatureGates(effectivePlanId);

  // Whether any advanced recording feature is gated on this plan
  const hasAdvancedRecording =
    featureGates.requestConsoleLogs ||
    featureGates.requestActionReplay ||
    featureGates.requestNetworkActivity ||
    featureGates.requestServerLogs;

  const updateSetting = <K extends keyof DomainRecordingPreferences>(
    key: K,
    value: DomainRecordingPreferences[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Recording Settings</div>

      <div className="space-y-4 pl-1">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={`${idPrefix}-hide-sensitive`}
            className={`text-sm font-normal flex-1 ${disabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
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

        {!hasAdvancedRecording && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Upgrade your plan to configure advanced recording settings
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label
            htmlFor={`${idPrefix}-console-logs`}
            className={`text-sm font-normal flex-1 ${disabled || !featureGates.requestConsoleLogs ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Capture console logs
          </Label>
          <Switch
            id={`${idPrefix}-console-logs`}
            checked={settings.recordingCaptureClientLog}
            onCheckedChange={(checked) => updateSetting('recordingCaptureClientLog', checked)}
            disabled={disabled || !featureGates.requestConsoleLogs}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor={`${idPrefix}-client-actions`}
            className={`text-sm font-normal flex-1 ${disabled || !featureGates.requestActionReplay ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Capture client actions
          </Label>
          <Switch
            id={`${idPrefix}-client-actions`}
            checked={settings.recordingCaptureClientAction}
            onCheckedChange={(checked) => updateSetting('recordingCaptureClientAction', checked)}
            disabled={disabled || !featureGates.requestActionReplay}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor={`${idPrefix}-network-logs`}
            className={`text-sm font-normal flex-1 ${disabled || !featureGates.requestNetworkActivity ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Capture network logs
          </Label>
          <Switch
            id={`${idPrefix}-network-logs`}
            checked={settings.recordingCaptureNetworkLog}
            onCheckedChange={(checked) => updateSetting('recordingCaptureNetworkLog', checked)}
            disabled={disabled || !featureGates.requestNetworkActivity}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor={`${idPrefix}-backend-server`}
            className={`text-sm font-normal flex-1 ${disabled || !featureGates.requestServerLogs ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Capture backend and server logs
          </Label>
          <Switch
            id={`${idPrefix}-backend-server`}
            checked={settings.recordingCaptureServerLog}
            onCheckedChange={(checked) => updateSetting('recordingCaptureServerLog', checked)}
            disabled={disabled || !featureGates.requestServerLogs}
          />
        </div>
      </div>
    </div>
  );
}
