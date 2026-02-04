'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { Switch } from '@workspace/ui/components/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { DomainRecordingPreferences } from '@/types/domain';

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
  const [localSettings, setLocalSettings] = useState<DomainRecordingPreferences>(settings);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [open, settings]);

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
                        href="https://userplane.io/docs/domains"
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVerify}
                    className="ml-2 min-w-[80px]"
                  >
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
                    onClick={handleSendInstructions}
                    className="ml-2 min-w-[80px]"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>

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
                    className={`text-sm font-normal flex-1 ${!verified ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    Hide sensitive fields
                  </Label>
                  <Switch
                    id="hide-sensitive"
                    checked={localSettings.recordingHideSensitive}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({ ...prev, recordingHideSensitive: checked }))
                    }
                    disabled={loading || !verified}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="console-logs"
                    className={`text-sm font-normal flex-1 ${!verified ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    Capture console logs
                  </Label>
                  <Switch
                    id="console-logs"
                    checked={localSettings.recordingCaptureClientLog}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({ ...prev, recordingCaptureClientLog: checked }))
                    }
                    disabled={loading || !verified}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="client-actions"
                    className={`text-sm font-normal flex-1 ${!verified ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    Capture client actions
                  </Label>
                  <Switch
                    id="client-actions"
                    checked={localSettings.recordingCaptureClientAction}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        recordingCaptureClientAction: checked,
                      }))
                    }
                    disabled={loading || !verified}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="network-logs"
                    className={`text-sm font-normal flex-1 ${!verified ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    Capture network logs
                  </Label>
                  <Switch
                    id="network-logs"
                    checked={localSettings.recordingCaptureNetworkLog}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({ ...prev, recordingCaptureNetworkLog: checked }))
                    }
                    disabled={loading || !verified}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="backend-server"
                    className={`text-sm font-normal flex-1 ${!verified ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    Capture backend and server logs
                  </Label>
                  <Switch
                    id="backend-server"
                    checked={localSettings.recordingCaptureServerLog}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({ ...prev, recordingCaptureServerLog: checked }))
                    }
                    disabled={loading || !verified}
                  />
                </div>
              </div>
            </div>
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
