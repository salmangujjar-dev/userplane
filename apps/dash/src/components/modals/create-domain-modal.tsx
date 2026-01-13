'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Label } from '@workspace/ui/components/label';
import { URLInput } from '@/components/url-input';
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
import { HelpCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { DomainVerificationHeader } from '@/components/domains/domain-verification-header';
import { DomainCodeSnippet } from '@/components/domains/domain-code-snippet';
import {
  DomainRecordingSettings,
  type DomainSettings,
} from '@/components/domains/domain-recording-settings';

type ModalStep = 'create' | 'verify' | 'verifying' | 'success' | 'failed';

interface CreatedDomain {
  domainId: string;
  domainUrl: string;
}

interface CreateDomainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDomain: (domainUrl: string) => Promise<CreatedDomain | null>;
  onStartVerification: (domainId: string) => Promise<string | null>;
  onPollVerification: (domainId: string) => Promise<boolean>;
  onFetchSettings: (domainId: string) => Promise<DomainSettings>;
  onSaveSettings: (domainId: string, settings: DomainSettings) => void;
  workspaceId: string;
  loading?: boolean;
  savingSettings?: boolean;
}

const DEFAULT_SETTINGS: DomainSettings = {
  hideSensitiveFields: false,
  captureConsoleLogs: false,
  captureClientActions: false,
  captureNetworkLogs: false,
  captureBackendServerLogs: false,
};

export function CreateDomainModal({
  open,
  onOpenChange,
  onCreateDomain,
  onStartVerification,
  onPollVerification,
  onFetchSettings,
  onSaveSettings,
  workspaceId,
  loading = false,
  savingSettings = false,
}: CreateDomainModalProps) {
  const [domainUrl, setDomainUrl] = useState('');
  const [step, setStep] = useState<ModalStep>('create');
  const [createdDomain, setCreatedDomain] = useState<CreatedDomain | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState<DomainSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<DomainSettings>(DEFAULT_SETTINGS);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      // Stop any active polling immediately
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
      // Small delay to allow closing animation before resetting state
      const timeout = setTimeout(() => {
        setDomainUrl('');
        setStep('create');
        setCreatedDomain(null);
        setShowSettings(false);
        setLocalSettings(DEFAULT_SETTINGS);
        setOriginalSettings(DEFAULT_SETTINGS);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const hasSettingsChanges = useMemo(() => {
    return (
      localSettings.hideSensitiveFields !== originalSettings.hideSensitiveFields ||
      localSettings.captureConsoleLogs !== originalSettings.captureConsoleLogs ||
      localSettings.captureClientActions !== originalSettings.captureClientActions ||
      localSettings.captureNetworkLogs !== originalSettings.captureNetworkLogs ||
      localSettings.captureBackendServerLogs !== originalSettings.captureBackendServerLogs
    );
  }, [localSettings, originalSettings]);

  const handleCreate = async () => {
    const isValid = domainUrl.trim();
    if (!isValid) return;

    const result = await onCreateDomain(domainUrl);
    if (result) {
      setCreatedDomain(result);
      setStep('verify');
    }
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const pollVerificationStatus = async (domainId: string, attempt: number = 0) => {
    try {
      const isVerified = await onPollVerification(domainId);

      if (isVerified) {
        stopPolling();
        // Fetch settings on success
        try {
          const settings = await onFetchSettings(domainId);
          setLocalSettings(settings);
          setOriginalSettings(settings);
        } catch {
          // Use defaults on error
        }
        setStep('success');
      } else if (attempt < 10) {
        const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000);
        pollingRef.current = setTimeout(() => {
          pollVerificationStatus(domainId, attempt + 1);
        }, delay);
      } else {
        stopPolling();
        setStep('failed');
      }
    } catch {
      stopPolling();
      setStep('failed');
    }
  };

  const handleVerify = async () => {
    if (!createdDomain) return;

    setStep('verifying');

    const verificationUrl = await onStartVerification(createdDomain.domainId);
    if (verificationUrl) {
      window.open(verificationUrl, '_blank', 'noopener,noreferrer');
      pollVerificationStatus(createdDomain.domainId);
    } else {
      setStep('failed');
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  const handleTryAgain = () => {
    setStep('verify');
  };

  const handleDone = () => {
    if (hasSettingsChanges && createdDomain) {
      onSaveSettings(createdDomain.domainId, localSettings);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setDomainUrl('');
    onOpenChange(false);
  };

  const isFormValid = domainUrl.trim();

  // Step: Create
  if (step === 'create') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Add New Domain</DialogTitle>
                <div className="flex items-center gap-2">
                  <DialogDescription className="text-sm text-muted-foreground">
                    Add a new domain for recording sessions
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
                        <p>Learn more about domains</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain-url" className="text-sm">
                  Domain URL
                </Label>
                <URLInput
                  id="domain-url"
                  value={domainUrl}
                  onChange={setDomainUrl}
                  placeholder="example.com"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8">
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full px-6"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-full px-6"
                onClick={handleCreate}
                disabled={!isFormValid || loading}
              >
                {loading ? 'Adding...' : 'Add Domain'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Step: Verify (show code snippet)
  if (step === 'verify' || step === 'failed') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <DomainVerificationHeader />

              <div className="text-center space-y-1">
                <DialogTitle className="text-xl font-semibold">
                  {step === 'failed' ? "Let's try again" : 'Verify your domain'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Add code snippet to capture logs
                </DialogDescription>
              </div>
            </div>

            <DomainCodeSnippet
              workspaceId={workspaceId}
              domainUrl={createdDomain?.domainUrl || ''}
            />
          </div>

          <DialogFooter className="mt-8">
            <button
              type="button"
              onClick={() => window.open('https://docs.userplane.com/domains', '_blank')}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
            >
              <HelpCircle className="h-4 w-4" />
              How it works
            </button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full px-6"
                onClick={handleSkip}
              >
                Skip
              </Button>
              <Button
                type="button"
                className="rounded-full px-6"
                onClick={step === 'failed' ? handleTryAgain : handleVerify}
              >
                {step === 'failed' ? 'Try Again' : 'Verify'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Step: Verifying (loading state)
  if (step === 'verifying') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <DomainVerificationHeader />

              <div className="text-center space-y-2">
                <DialogTitle className="text-xl font-semibold">Verifying domain...</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Please complete verification in the opened tab
                </DialogDescription>
              </div>
            </div>

            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>

          <DialogFooter className="mt-8">
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full px-6"
                onClick={handleSkip}
              >
                Skip
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Step: Success (show recording settings)
  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <DomainVerificationHeader />

              <div className="text-center space-y-2">
                <DialogTitle className="text-xl font-semibold">Your domain verified</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Console and network logs capture enabled
                </DialogDescription>
              </div>
            </div>

            {showSettings && (
              <DomainRecordingSettings
                settings={localSettings}
                onSettingsChange={setLocalSettings}
                disabled={savingSettings}
                idPrefix="create"
              />
            )}
          </div>

          <DialogFooter className="mt-8">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
              disabled={savingSettings}
            >
              {showSettings ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Recording Settings
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Recording Settings
                </>
              )}
            </button>
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                className="rounded-full px-6"
                onClick={handleDone}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Done'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
