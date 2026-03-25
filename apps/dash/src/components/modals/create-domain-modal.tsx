'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@userplane/ui/components/tooltip';
import { ChevronDown, ChevronUp, HelpCircle, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type Control, Controller, type FieldErrors, useForm } from 'react-hook-form';
import { z } from 'zod';

import { DomainCodeSnippet } from '@/components/domains/domain-code-snippet';
import { DomainRecordingSettings } from '@/components/domains/domain-recording-settings';
import { DomainVerificationHeader } from '@/components/domains/domain-verification-header';
import { URLInput } from '@/components/url-input';
import { SUPPORT_LINKS } from '@/constants';
import { DomainUrlSchema } from '@/schemas';
import {
  DEFAULT_DOMAIN_RECORDING_PREFERENCES,
  type DomainRecordingPreferences,
} from '@/types/domain';

type ModalStep = 'create' | 'verify' | 'verifying' | 'success' | 'failed';

interface CreatedDomain {
  domainId: string;
  domainUrl: string;
}

interface ModalState {
  step: ModalStep;
  createdDomain: CreatedDomain | null;
  showSettings: boolean;
  localSettings: DomainRecordingPreferences;
  originalSettings: DomainRecordingPreferences;
}

const initialModalState: ModalState = {
  step: 'create',
  createdDomain: null,
  showSettings: false,
  localSettings: DEFAULT_DOMAIN_RECORDING_PREFERENCES,
  originalSettings: DEFAULT_DOMAIN_RECORDING_PREFERENCES,
};

interface CreateDomainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDomain: (domainUrl: string) => Promise<CreatedDomain | null>;
  onStartVerification: (domainId: string) => Promise<string | null>;
  onPollVerification: (domainId: string) => Promise<boolean>;
  onFetchSettings: (domainId: string) => Promise<DomainRecordingPreferences>;
  onSaveSettings: (domainId: string, settings: DomainRecordingPreferences) => void;
  workspaceId: string;
  loading?: boolean;
  savingSettings?: boolean;
}

const createDomainFormSchema = z.object({
  domainUrl: DomainUrlSchema,
});

type CreateDomainFormData = z.infer<typeof createDomainFormSchema>;

interface CreateDomainStepProps {
  control: Control<CreateDomainFormData>;
  errors: FieldErrors<CreateDomainFormData>;
  isValid: boolean;
  loading: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel: () => void;
}

function CreateDomainStep({
  control,
  errors,
  isValid,
  loading,
  onSubmit,
  onCancel,
}: CreateDomainStepProps) {
  return (
    <form onSubmit={onSubmit}>
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
                      href={SUPPORT_LINKS.domains}
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
            <Controller
              name="domainUrl"
              control={control}
              render={({ field }) => (
                <URLInput
                  id="domain-url"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="example.com"
                  error={!!errors.domainUrl}
                  disabled={loading}
                />
              )}
            />
            {errors.domainUrl && (
              <p className="text-sm text-destructive">{errors.domainUrl.message}</p>
            )}
          </div>
        </div>
      </div>

      <DialogFooter className="mt-8">
        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            variant="secondary"
            className="px-6"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="px-6" disabled={!isValid || loading}>
            {loading ? 'Adding...' : 'Add Domain'}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

interface VerifyDomainStepProps {
  workspaceId: string;
  domainUrl: string;
  isFailed: boolean;
  onVerify: () => void;
  onSkip: () => void;
}

function VerifyDomainStep({
  workspaceId,
  domainUrl,
  isFailed,
  onVerify,
  onSkip,
}: VerifyDomainStepProps) {
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <DomainVerificationHeader />

          <div className="text-center space-y-1">
            <DialogTitle className="text-xl font-semibold">
              {isFailed ? "Let's try again" : 'Verify your domain'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Add code snippet to capture logs
            </DialogDescription>
          </div>
        </div>

        <DomainCodeSnippet workspaceId={workspaceId} domainUrl={domainUrl} />
      </div>

      <DialogFooter className="mt-8">
        <button
          type="button"
          onClick={() => window.open(SUPPORT_LINKS.domainVerification, '_blank')}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
        >
          <HelpCircle className="h-4 w-4" />
          How it works
        </button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="px-6" onClick={onSkip}>
            Skip
          </Button>
          <Button type="button" className="px-6" onClick={onVerify}>
            {isFailed ? 'Try Again' : 'Verify'}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

interface VerifyingDomainStepProps {
  onSkip: () => void;
}

function VerifyingDomainStep({ onSkip }: VerifyingDomainStepProps) {
  return (
    <>
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
          <Button type="button" variant="secondary" className="px-6" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

interface SuccessDomainStepProps {
  showSettings: boolean;
  settings: DomainRecordingPreferences;
  savingSettings: boolean;
  onToggleSettings: () => void;
  onSettingsChange: (settings: DomainRecordingPreferences) => void;
  onDone: () => void;
}

function SuccessDomainStep({
  showSettings,
  settings,
  savingSettings,
  onToggleSettings,
  onSettingsChange,
  onDone,
}: SuccessDomainStepProps) {
  return (
    <>
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
            settings={settings}
            onSettingsChange={onSettingsChange}
            disabled={savingSettings}
            idPrefix="create"
          />
        )}
      </div>

      <DialogFooter className="mt-8">
        <button
          type="button"
          onClick={onToggleSettings}
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
          <Button type="button" className="px-6" onClick={onDone} disabled={savingSettings}>
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
    </>
  );
}

interface StepContentProps {
  step: ModalStep;
  control: Control<CreateDomainFormData>;
  errors: FieldErrors<CreateDomainFormData>;
  isValid: boolean;
  loading: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel: () => void;
  workspaceId: string;
  domainUrl: string;
  onVerify: () => void;
  onTryAgain: () => void;
  onSkip: () => void;
  showSettings: boolean;
  settings: DomainRecordingPreferences;
  savingSettings: boolean;
  onToggleSettings: () => void;
  onSettingsChange: (settings: DomainRecordingPreferences) => void;
  onDone: () => void;
}

function StepContent({
  step,
  control,
  errors,
  isValid,
  loading,
  onSubmit,
  onCancel,
  workspaceId,
  domainUrl,
  onVerify,
  onTryAgain,
  onSkip,
  showSettings,
  settings,
  savingSettings,
  onToggleSettings,
  onSettingsChange,
  onDone,
}: StepContentProps) {
  switch (step) {
    case 'create':
      return (
        <CreateDomainStep
          control={control}
          errors={errors}
          isValid={isValid}
          loading={loading}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

    case 'verify':
    case 'failed':
      return (
        <VerifyDomainStep
          workspaceId={workspaceId}
          domainUrl={domainUrl}
          isFailed={step === 'failed'}
          onVerify={step === 'failed' ? onTryAgain : onVerify}
          onSkip={onSkip}
        />
      );

    case 'verifying':
      return <VerifyingDomainStep onSkip={onSkip} />;

    case 'success':
      return (
        <SuccessDomainStep
          showSettings={showSettings}
          settings={settings}
          savingSettings={savingSettings}
          onToggleSettings={onToggleSettings}
          onSettingsChange={onSettingsChange}
          onDone={onDone}
        />
      );

    default:
      return null;
  }
}

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
  const [modalState, setModalState] = useState<ModalState>(initialModalState);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(createDomainFormSchema),
    mode: 'onTouched',
    defaultValues: {
      domainUrl: '',
    },
  });

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
        reset();
        setModalState(initialModalState);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [open, reset]);

  const hasSettingsChanges = useMemo(() => {
    const { localSettings, originalSettings } = modalState;
    return (
      localSettings.recordingHideSensitive !== originalSettings.recordingHideSensitive ||
      localSettings.recordingCaptureClientLog !== originalSettings.recordingCaptureClientLog ||
      localSettings.recordingCaptureClientAction !==
        originalSettings.recordingCaptureClientAction ||
      localSettings.recordingCaptureNetworkLog !== originalSettings.recordingCaptureNetworkLog ||
      localSettings.recordingCaptureServerLog !== originalSettings.recordingCaptureServerLog
    );
  }, [modalState]);

  const handleCreate = async (data: { domainUrl: string }) => {
    const result = await onCreateDomain(data.domainUrl);
    if (result) {
      setModalState((prev) => ({ ...prev, createdDomain: result, step: 'verify' }));
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
          setModalState((prev) => ({
            ...prev,
            localSettings: settings,
            originalSettings: settings,
            step: 'success',
          }));
        } catch {
          // Use defaults on error
          setModalState((prev) => ({ ...prev, step: 'success' }));
        }
      } else if (attempt < 10) {
        const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000);
        pollingRef.current = setTimeout(() => {
          pollVerificationStatus(domainId, attempt + 1);
        }, delay);
      } else {
        stopPolling();
        setModalState((prev) => ({ ...prev, step: 'failed' }));
      }
    } catch {
      stopPolling();
      setModalState((prev) => ({ ...prev, step: 'failed' }));
    }
  };

  const handleVerify = async () => {
    if (!modalState.createdDomain) return;

    setModalState((prev) => ({ ...prev, step: 'verifying' }));

    const verificationUrl = await onStartVerification(modalState.createdDomain.domainId);
    if (verificationUrl) {
      window.open(verificationUrl, '_blank', 'noopener,noreferrer');
      pollVerificationStatus(modalState.createdDomain.domainId);
    } else {
      setModalState((prev) => ({ ...prev, step: 'failed' }));
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  const handleTryAgain = () => {
    setModalState((prev) => ({ ...prev, step: 'verify' }));
  };

  const handleDone = () => {
    if (hasSettingsChanges && modalState.createdDomain) {
      onSaveSettings(modalState.createdDomain.domainId, modalState.localSettings);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <StepContent
          step={modalState.step}
          control={control}
          errors={errors}
          isValid={isValid}
          loading={loading}
          onSubmit={handleSubmit(handleCreate)}
          onCancel={handleCancel}
          workspaceId={workspaceId}
          domainUrl={modalState.createdDomain?.domainUrl || ''}
          onVerify={handleVerify}
          onTryAgain={handleTryAgain}
          onSkip={handleSkip}
          showSettings={modalState.showSettings}
          settings={modalState.localSettings}
          savingSettings={savingSettings}
          onToggleSettings={() =>
            setModalState((prev) => ({ ...prev, showSettings: !prev.showSettings }))
          }
          onSettingsChange={(settings) =>
            setModalState((prev) => ({ ...prev, localSettings: settings }))
          }
          onDone={handleDone}
        />
      </DialogContent>
    </Dialog>
  );
}
