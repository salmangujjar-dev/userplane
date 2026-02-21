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
import { Switch } from '@workspace/ui/components/switch';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { DomainCodeSnippet } from '@/components/domains/domain-code-snippet';
import { DomainRecordingSettings } from '@/components/domains/domain-recording-settings';
import { DomainVerificationHeader } from '@/components/domains/domain-verification-header';
import type { DomainRecordingPreferences } from '@/types/domain';

interface DomainVerificationPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainUrl: string;
  workspaceId: string;
  onReverify?: () => void;
  verified?: boolean;
  settings: DomainRecordingPreferences;
  onSaveSettings: (settings: DomainRecordingPreferences) => void;
  loadingSettings?: boolean;
}

export function DomainVerificationPostModal({
  open,
  onOpenChange,
  domainUrl,
  workspaceId,
  onReverify,
  verified = true,
  settings,
  onSaveSettings,
  loadingSettings = false,
}: DomainVerificationPostModalProps) {
  const [localSettings, setLocalSettings] = useState<DomainRecordingPreferences>(settings);
  const [showSettings, setShowSettings] = useState(false);

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

  const handleDone = () => {
    if (hasChanges) {
      onSaveSettings(localSettings);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <DomainVerificationHeader />

            <div className="text-center space-y-2">
              <DialogTitle className="text-xl font-semibold">
                {verified ? 'Your domain verified' : "Let's try again"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {verified ? 'Console and network logs capture enabled' : ''}
              </DialogDescription>
            </div>
          </div>

          {verified && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                <Label
                  htmlFor="post-hide-sensitive-main"
                  className={`text-sm font-medium flex-1 ${loadingSettings ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Hide sensitive fields
                </Label>
                <Switch
                  id="post-hide-sensitive-main"
                  checked={localSettings.recordingHideSensitive}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, recordingHideSensitive: checked })
                  }
                  disabled={loadingSettings}
                />
              </div>

              {showSettings && (
                <DomainRecordingSettings
                  settings={localSettings}
                  onSettingsChange={setLocalSettings}
                  disabled={loadingSettings}
                  idPrefix="post"
                  hideHideSensitiveField
                />
              )}
            </div>
          )}

          {!verified && <DomainCodeSnippet workspaceId={workspaceId} domainUrl={domainUrl} />}
        </div>

        <DialogFooter className="mt-8">
          {verified && (
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
              disabled={loadingSettings}
            >
              {showSettings ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Advanced Settings
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Advanced Settings
                </>
              )}
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            {verified && (
              <Button
                type="button"
                variant="secondary"
                className="rounded-full px-6"
                onClick={() => {
                  if (onReverify) {
                    onReverify();
                  }
                }}
              >
                Reverify
              </Button>
            )}
            {!verified && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-6"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            )}
            {!verified && (
              <Button
                type="button"
                className="rounded-full px-6"
                onClick={() => {
                  if (onReverify) {
                    onReverify();
                  }
                }}
              >
                Try Again
              </Button>
            )}
            {verified && (
              <Button
                type="button"
                className="rounded-full px-6"
                onClick={handleDone}
                disabled={loadingSettings}
              >
                {loadingSettings ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Done'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
