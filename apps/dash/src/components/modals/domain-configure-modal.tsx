'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { HelpCircle, AlertCircle } from 'lucide-react';

interface DomainSettings {
  hideSensitiveFields: boolean;
  captureConsoleNetworkLogs: boolean;
  captureBackendServerLogs: boolean;
}

interface DomainConfigureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainUrl: string;
  verified: boolean;
  settings: DomainSettings;
  onSave: (settings: DomainSettings) => void;
  onVerify: () => void;
  onShowVerified: () => void;
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
  onShowVerified,
  loading = false,
}: DomainConfigureModalProps) {
  const [localSettings, setLocalSettings] = useState<DomainSettings>(settings);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [open, settings]);

  const hasChanges = useMemo(() => {
    return (
      localSettings.hideSensitiveFields !== settings.hideSensitiveFields ||
      localSettings.captureConsoleNetworkLogs !== settings.captureConsoleNetworkLogs ||
      localSettings.captureBackendServerLogs !== settings.captureBackendServerLogs
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

  const handleShowVerified = () => {
    onOpenChange(false);
    onShowVerified();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Configure Domain</DialogTitle>
              <div className="flex items-center gap-1.5">
                <DialogDescription className="text-sm text-muted-foreground">
                  {domainUrl}
                </DialogDescription>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href="https://userplane.com/docs/domains"
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
                        ? 'View verification details and settings'
                        : 'Complete domain verification to enable recordings'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={verified ? handleShowVerified : handleVerify}
                    className="ml-2"
                  >
                    {verified ? 'Details' : 'Verify'}
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
                    checked={localSettings.hideSensitiveFields}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({ ...prev, hideSensitiveFields: checked }))
                    }
                    disabled={loading || !verified}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="console-network"
                    className={`text-sm font-normal flex-1 ${!verified ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    Capture console and network logs
                  </Label>
                  <Switch
                    id="console-network"
                    checked={localSettings.captureConsoleNetworkLogs}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({ ...prev, captureConsoleNetworkLogs: checked }))
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
                    checked={localSettings.captureBackendServerLogs}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({ ...prev, captureBackendServerLogs: checked }))
                    }
                    disabled={loading || !verified}
                  />
                </div>
              </div>
            </div>
          </div>

          {hasChanges && (
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
