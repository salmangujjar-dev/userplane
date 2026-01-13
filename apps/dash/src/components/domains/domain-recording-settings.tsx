import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';

export interface DomainSettings {
  hideSensitiveFields: boolean;
  captureConsoleLogs: boolean;
  captureClientActions: boolean;
  captureNetworkLogs: boolean;
  captureBackendServerLogs: boolean;
}

interface DomainRecordingSettingsProps {
  settings: DomainSettings;
  onSettingsChange: (settings: DomainSettings) => void;
  disabled?: boolean;
  idPrefix?: string;
}

export function DomainRecordingSettings({
  settings,
  onSettingsChange,
  disabled = false,
  idPrefix = 'domain',
}: DomainRecordingSettingsProps) {
  const updateSetting = <K extends keyof DomainSettings>(key: K, value: DomainSettings[K]) => {
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
            checked={settings.hideSensitiveFields}
            onCheckedChange={(checked) => updateSetting('hideSensitiveFields', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor={`${idPrefix}-console-logs`}
            className={`text-sm font-normal flex-1 ${disabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Capture console logs
          </Label>
          <Switch
            id={`${idPrefix}-console-logs`}
            checked={settings.captureConsoleLogs}
            onCheckedChange={(checked) => updateSetting('captureConsoleLogs', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor={`${idPrefix}-client-actions`}
            className={`text-sm font-normal flex-1 ${disabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Capture client actions
          </Label>
          <Switch
            id={`${idPrefix}-client-actions`}
            checked={settings.captureClientActions}
            onCheckedChange={(checked) => updateSetting('captureClientActions', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor={`${idPrefix}-network-logs`}
            className={`text-sm font-normal flex-1 ${disabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Capture network logs
          </Label>
          <Switch
            id={`${idPrefix}-network-logs`}
            checked={settings.captureNetworkLogs}
            onCheckedChange={(checked) => updateSetting('captureNetworkLogs', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor={`${idPrefix}-backend-server`}
            className={`text-sm font-normal flex-1 ${disabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
          >
            Capture backend and server logs
          </Label>
          <Switch
            id={`${idPrefix}-backend-server`}
            checked={settings.captureBackendServerLogs}
            onCheckedChange={(checked) => updateSetting('captureBackendServerLogs', checked)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
