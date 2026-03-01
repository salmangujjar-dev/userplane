'use client';

import type { FeatureGate, PlanFeatureGates } from '@userplane/pricing';
import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import { Switch } from '@userplane/ui/components/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@userplane/ui/components/tooltip';
import { cn } from '@userplane/ui/lib/utils';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { SUPPORT_LINKS } from '@/constants';
import { useSubscriptionStatus } from '@/features/billing';
import { useFeatureUpsell } from '@/hooks/use-feature-upsell';
import type { DomainRecordingPreferences } from '@/types/domain';

interface GatedToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  featureKey: FeatureGate;
  featureGates: PlanFeatureGates | undefined;
  triggerUpsell: (featureKey: FeatureGate) => void;
  loading: boolean;
  verified: boolean;
}

function GatedToggle({
  id,
  label,
  checked,
  onChange,
  featureKey,
  featureGates,
  triggerUpsell,
  loading,
  verified,
}: GatedToggleProps) {
  const gated = !featureGates?.[featureKey];
  const isDisabled = loading || !verified;
  const isInteractive = gated && !isDisabled;
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
          isDisabled || gated ? 'text-muted-foreground' : 'cursor-pointer',
          gated && !isDisabled && 'cursor-pointer'
        )}
      >
        {label}
      </Label>
      <span className={cn(gated && 'pointer-events-none')}>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          disabled={isDisabled || gated}
        />
      </span>
    </div>
  );
}

interface VerificationStatusSectionProps {
  verified: boolean;
  onVerify: () => void;
  onSendInstructions: () => void;
}

function VerificationStatusSection({
  verified,
  onVerify,
  onSendInstructions,
}: VerificationStatusSectionProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Verification Status</div>
      <div className="space-y-3 pl-1">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${verified ? 'bg-green-500' : 'bg-yellow-500'}`}
              />
              <div className="text-sm font-normal">
                {verified ? 'Domain is verified' : 'Domain verification pending'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 ml-4">
              {verified
                ? 'Re-run verification to confirm scripts are installed'
                : 'Complete domain verification to enable recordings'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onVerify} className="ml-2 min-w-[80px]">
            {verified ? 'Reverify' : 'Verify'}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${verified ? 'bg-green-500' : 'bg-blue-500'}`}
              />
              <div className="text-sm font-normal">Send developer instructions</div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 ml-4">
              Email setup instructions to your development team
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSendInstructions}
            className="ml-2 min-w-[80px]"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

interface RecordingSettingsSectionProps {
  verified: boolean;
  loading: boolean;
  localSettings: DomainRecordingPreferences;
  onSettingsChange: (
    updater: (prev: DomainRecordingPreferences) => DomainRecordingPreferences
  ) => void;
  featureGates: PlanFeatureGates | undefined;
  triggerUpsell: (featureKey: FeatureGate) => void;
}

function RecordingSettingsSection({
  verified,
  loading,
  localSettings,
  onSettingsChange,
  featureGates,
  triggerUpsell,
}: RecordingSettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Recording Settings</div>

      {!verified && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Verify your domain to enable recording settings
          </p>
        </div>
      )}

      <div className="space-y-4 pl-1">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="hide-sensitive"
            className={cn(
              'text-sm font-normal flex-1',
              !verified ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'
            )}
          >
            Hide sensitive fields
          </Label>
          <Switch
            id="hide-sensitive"
            checked={localSettings.recordingHideSensitive}
            onCheckedChange={(checked) =>
              onSettingsChange((prev) => ({ ...prev, recordingHideSensitive: checked }))
            }
            disabled={loading || !verified}
          />
        </div>

        <GatedToggle
          id="console-logs"
          label="Capture console logs"
          checked={localSettings.recordingCaptureClientLog}
          onChange={(checked) =>
            onSettingsChange((prev) => ({ ...prev, recordingCaptureClientLog: checked }))
          }
          featureKey="captureConsoleLog"
          featureGates={featureGates}
          triggerUpsell={triggerUpsell}
          loading={loading}
          verified={verified}
        />

        <GatedToggle
          id="client-actions"
          label="Capture client actions"
          checked={localSettings.recordingCaptureClientAction}
          onChange={(checked) =>
            onSettingsChange((prev) => ({
              ...prev,
              recordingCaptureClientAction: checked,
            }))
          }
          featureKey="captureUserActions"
          featureGates={featureGates}
          triggerUpsell={triggerUpsell}
          loading={loading}
          verified={verified}
        />

        <GatedToggle
          id="network-logs"
          label="Capture network logs"
          checked={localSettings.recordingCaptureNetworkLog}
          onChange={(checked) =>
            onSettingsChange((prev) => ({ ...prev, recordingCaptureNetworkLog: checked }))
          }
          featureKey="captureNetworkActivity"
          featureGates={featureGates}
          triggerUpsell={triggerUpsell}
          loading={loading}
          verified={verified}
        />

        <GatedToggle
          id="backend-server"
          label="Capture backend and server logs"
          checked={localSettings.recordingCaptureServerLog}
          onChange={(checked) =>
            onSettingsChange((prev) => ({ ...prev, recordingCaptureServerLog: checked }))
          }
          featureKey="captureServerLogs"
          featureGates={featureGates}
          triggerUpsell={triggerUpsell}
          loading={loading}
          verified={verified}
        />
      </div>
    </div>
  );
}

interface DomainConfigureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainUrl: string;
  domainId?: string;
  verified: boolean;
  settings: DomainRecordingPreferences;
  onSave: (settings: DomainRecordingPreferences) => void;
  onVerify: () => void;
  onSendInstructions: () => void;
  loading?: boolean;
}

export function DomainConfigureModal({
  open,
  onOpenChange,
  domainUrl,
  verified,
  settings,
  onSave,
  onVerify,
  onSendInstructions,
  loading = false,
}: DomainConfigureModalProps) {
  const { data: subscriptionResult } = useSubscriptionStatus();
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const featureGates = subscriptionData?.featureGates;
  const { triggerUpsell } = useFeatureUpsell();

  const [localSettings, setLocalSettings] = useState<DomainRecordingPreferences>(settings);

  // Sync local settings when the modal opens or when the settings prop changes
  const prevOpenRef = useRef(open);
  const prevSettingsRef = useRef(settings);
  if ((open && !prevOpenRef.current) || prevSettingsRef.current !== settings) {
    setLocalSettings(settings);
    prevSettingsRef.current = settings;
  }
  prevOpenRef.current = open;

  const hasChanges = useMemo(() => {
    return (
      localSettings.recordingHideSensitive !== settings.recordingHideSensitive ||
      localSettings.recordingCaptureClientLog !== settings.recordingCaptureClientLog ||
      localSettings.recordingCaptureClientAction !== settings.recordingCaptureClientAction ||
      localSettings.recordingCaptureNetworkLog !== settings.recordingCaptureNetworkLog ||
      localSettings.recordingCaptureServerLog !== settings.recordingCaptureServerLog
    );
  }, [localSettings, settings]);

  const handleSave = () => {
    onSave(localSettings);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
  };

  const handleVerify = () => {
    onOpenChange(false);
    onVerify();
  };

  const handleSendInstructions = () => {
    onOpenChange(false);
    onSendInstructions();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Configure Domain</DialogTitle>
              <div className="flex items-center gap-2">
                <DialogDescription className="text-sm text-muted-foreground">
                  {domainUrl}
                </DialogDescription>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={SUPPORT_LINKS.domains}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Learn more about domain settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <VerificationStatusSection
              verified={verified}
              onVerify={handleVerify}
              onSendInstructions={handleSendInstructions}
            />

            <RecordingSettingsSection
              verified={verified}
              loading={loading}
              localSettings={localSettings}
              onSettingsChange={setLocalSettings}
              featureGates={featureGates}
              triggerUpsell={triggerUpsell}
            />
          </div>

          <DialogFooter
            className={cn(
              'transition-opacity',
              hasChanges ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            aria-hidden={!hasChanges}
          >
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              tabIndex={hasChanges ? 0 : -1}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} tabIndex={hasChanges ? 0 : -1}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
