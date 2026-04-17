'use client';

import { Button } from '@userplane/ui/components/button';
import { Input } from '@userplane/ui/components/input';
import { Label } from '@userplane/ui/components/label';
import { Switch } from '@userplane/ui/components/switch';
import { cn } from '@userplane/ui/lib/utils';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import { SectionError } from '@/components/shared/section-error';
import { RecordingLinkSectionSkeleton } from '@/components/skeleton';
import { useSubscriptionStatus } from '@/features/billing';
import {
  useUpdateAppearance,
  useUpdateToggle,
  useUploadWorkspaceLogo,
  useWorkspacePreferences,
} from '@/features/workspace';
import { useDebouncedToggle } from '@/hooks/use-debounced-toggle';
import { useFeatureUpsell } from '@/hooks/use-feature-upsell';
import { handleUnknownError } from '@/lib/errors';
import { useWorkspaceId } from '@/stores/workspace';

import { RecordingLinkPreview } from './recording-link-preview';

interface CustomizeToggleCardProps {
  enabled: boolean;
  onToggle: (checked: boolean) => void;
  featureEnabled: boolean;
  onUpsell: () => void;
}

function CustomizeToggleCard({
  enabled,
  onToggle,
  featureEnabled,
  onUpsell,
}: CustomizeToggleCardProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-6 rounded-xl border bg-card',
        !featureEnabled && 'cursor-pointer'
      )}
      {...(!featureEnabled
        ? {
            role: 'button' as const,
            tabIndex: 0,
            onClick: () => onUpsell(),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onUpsell();
              }
            },
          }
        : {})}
    >
      <Label
        htmlFor={featureEnabled ? 'customize-recording-link' : undefined}
        className={cn(
          'text-sm font-medium',
          featureEnabled ? 'cursor-pointer' : 'text-muted-foreground cursor-pointer'
        )}
      >
        Customize recording link
      </Label>
      <span className={cn(!featureEnabled && 'pointer-events-none')}>
        <Switch
          id="customize-recording-link"
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={!featureEnabled}
        />
      </span>
    </div>
  );
}

interface LogoUploadFieldProps {
  workspaceImage: string | null;
  isUploading: boolean;
  onUploadClick: () => void;
}

function LogoUploadField({ workspaceImage, isUploading, onUploadClick }: LogoUploadFieldProps) {
  return (
    <div className="shrink-0">
      <Label className="text-sm font-medium">Company Image</Label>
      <button
        type="button"
        onClick={onUploadClick}
        disabled={isUploading}
        className="relative w-24 h-24 mt-2 rounded-lg border-2 border-dashed border-input hover:border-primary hover:bg-accent transition-colors flex flex-col items-center justify-center gap-1 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
        ) : workspaceImage ? (
          <Image
            src={workspaceImage}
            alt="Workspace"
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Upload</span>
          </>
        )}
      </button>
    </div>
  );
}

interface RecordingLinkTextFieldsProps {
  workspaceName: string;
  headerText: string;
  footnoteText: string;
  primaryColor: string;
  onFieldChange: (field: string, value: string) => void;
}

function RecordingLinkTextFields({
  workspaceName,
  headerText,
  footnoteText,
  primaryColor,
  onFieldChange,
}: RecordingLinkTextFieldsProps) {
  return (
    <div className="flex-1 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="workspace-name" className="text-sm font-medium">
          Company Name
        </Label>
        <Input
          id="workspace-name"
          value={workspaceName}
          onChange={(e) => onFieldChange('workspaceName', e.target.value)}
          placeholder="Enter workspace name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="header-text" className="text-sm font-medium">
          Recording Header
        </Label>
        <Input
          id="header-text"
          value={headerText}
          onChange={(e) => onFieldChange('headerText', e.target.value)}
          placeholder="Get ready to record"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="footnote-text" className="text-sm font-medium">
          Recording Footnote
        </Label>
        <Input
          id="footnote-text"
          value={footnoteText}
          onChange={(e) => onFieldChange('footnoteText', e.target.value)}
          placeholder="Enter footnote text (optional)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="primary-color" className="text-sm font-medium">
          Primary color
        </Label>
        <div className="flex gap-2 items-center">
          <input
            id="primary-color"
            type="color"
            value={primaryColor}
            onChange={(e) => onFieldChange('primaryColor', e.target.value)}
            className="h-10 w-20 rounded border border-input cursor-pointer"
          />
          <Input
            value={primaryColor}
            onChange={(e) => onFieldChange('primaryColor', e.target.value)}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

interface AppearanceActionButtonsProps {
  hasChanges: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onUpdate: () => void;
}

function AppearanceActionButtons({
  hasChanges,
  isSaving,
  onCancel,
  onUpdate,
}: AppearanceActionButtonsProps) {
  return (
    <div className="min-h-[52px] pt-4 mt-6">
      <div
        className={cn(
          'flex gap-3 justify-end transition-opacity',
          hasChanges ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden={!hasChanges}
      >
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          tabIndex={hasChanges ? 0 : -1}
        >
          Cancel
        </Button>
        <Button onClick={onUpdate} disabled={isSaving} tabIndex={hasChanges ? 0 : -1}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
        </Button>
      </div>
    </div>
  );
}

export function RecordingLinkSection() {
  const workspaceId = useWorkspaceId();
  const { data: preferencesResult, isLoading, error, refetch } = useWorkspacePreferences();
  const { data: subscriptionResult } = useSubscriptionStatus();
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const featureGates = subscriptionData?.featureGates;
  const { triggerUpsell } = useFeatureUpsell();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preferences = preferencesResult?.success ? preferencesResult.data : null;

  const updateToggleMutation = useUpdateToggle(workspaceId, () => {
    // On error, allow re-sync from server
    shouldSyncToggleRef.current = true;
  });

  const {
    value: customizeRecordingLink,
    toggle: handleToggleChange,
    setValue: setCustomizeRecordingLink,
  } = useDebouncedToggle(false, (enabled) => updateToggleMutation.mutate(enabled));

  // Form state
  const [formState, setFormState] = useState({
    workspaceImage: null as string | null,
    workspaceName: '',
    headerText: '',
    footnoteText: '',
    primaryColor: '#000000',
  });

  // Logo file staged locally; uploaded to R2 only when the user clicks Update.
  // Decoupled from formState so a stale persisted CDN URL stays the source of
  // truth for "what's saved" until the upload + preferences mutation succeed.
  const [pendingLogo, setPendingLogo] = useState<{ file: File; previewUrl: string } | null>(null);

  // Track if toggle should sync from server
  const shouldSyncToggleRef = useRef(true);

  // Track whether formState has been seeded from preferences at least once.
  // The first seed must always run; later seeds respect `!hasChanges` so
  // background refetches can't clobber unsaved edits.
  const hasSeededRef = useRef(false);

  const updateAppearanceMutation = useUpdateAppearance(workspaceId);
  const uploadLogoMutation = useUploadWorkspaceLogo(workspaceId);

  const displayLogoUrl = pendingLogo?.previewUrl ?? formState.workspaceImage;
  const isSaving = updateAppearanceMutation.isPending || uploadLogoMutation.isPending;

  // Check if form has changes (excluding toggle, which auto-saves)
  const hasChanges = useMemo(() => {
    if (!preferences) return false;

    return (
      pendingLogo !== null ||
      formState.workspaceName !== (preferences.recordingCompanyName || '') ||
      formState.headerText !== (preferences.recordingHeader || '') ||
      formState.footnoteText !== (preferences.recordingFootnote || '') ||
      formState.primaryColor !== (preferences.recordingPrimaryColor || '#000000') ||
      formState.workspaceImage !== preferences.recordingCompanyLogoPath
    );
  }, [preferences, formState, pendingLogo]);

  // Seed form from API data, but skip the resync if the user has unsaved edits
  // so background refetches (window focus, invalidations) don't blow them away.
  useEffect(() => {
    if (preferences) {
      if (shouldSyncToggleRef.current) {
        setCustomizeRecordingLink(preferences.recordingCustomizeLink);
        shouldSyncToggleRef.current = false;
      }
      if (!hasSeededRef.current || !hasChanges) {
        setFormState({
          workspaceImage: preferences.recordingCompanyLogoPath,
          workspaceName: preferences.recordingCompanyName || '',
          headerText: preferences.recordingHeader || '',
          footnoteText: preferences.recordingFootnote || '',
          primaryColor: preferences.recordingPrimaryColor || '#000000',
        });
        hasSeededRef.current = true;
      }
    }
  }, [preferences, hasChanges, setCustomizeRecordingLink]);

  // Revoke any blob URL we hold when the staged logo is replaced or the
  // component unmounts. Prevents memory leaks across repeated re-picks.
  useEffect(() => {
    return () => {
      if (pendingLogo) {
        URL.revokeObjectURL(pendingLogo.previewUrl);
      }
    };
  }, [pendingLogo]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) {
      // Reset so picking the same filename again still fires onChange
      fileInputRef.current.value = '';
    }
    if (!file) return;

    setPendingLogo((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  };

  const handleUpdate = async () => {
    let logoUrl = formState.workspaceImage;
    const stagedLogo = pendingLogo;

    if (stagedLogo) {
      try {
        const result = await uploadLogoMutation.mutateAsync(stagedLogo.file);
        logoUrl = result.url;
      } catch (error) {
        handleUnknownError(error, 'Failed to upload logo');
        return;
      }
    }

    updateAppearanceMutation.mutate(
      {
        recordingCompanyName: formState.workspaceName || null,
        recordingCompanyLogoPath: logoUrl,
        recordingHeader: formState.headerText || null,
        recordingFootnote: formState.footnoteText || null,
        recordingPrimaryColor: formState.primaryColor,
      },
      {
        onSuccess: (result) => {
          if (!result.success) return;
          if (stagedLogo) {
            URL.revokeObjectURL(stagedLogo.previewUrl);
            setPendingLogo(null);
            setFormState((prev) => ({ ...prev, workspaceImage: logoUrl }));
          }
        },
      }
    );
  };

  const handleCancel = () => {
    if (pendingLogo) {
      URL.revokeObjectURL(pendingLogo.previewUrl);
      setPendingLogo(null);
    }
    if (preferences) {
      setCustomizeRecordingLink(preferences.recordingCustomizeLink);
      setFormState({
        workspaceImage: preferences.recordingCompanyLogoPath,
        workspaceName: preferences.recordingCompanyName || '',
        headerText: preferences.recordingHeader || '',
        footnoteText: preferences.recordingFootnote || '',
        primaryColor: preferences.recordingPrimaryColor || '#000000',
      });
    }
  };

  if (isLoading) {
    return <RecordingLinkSectionSkeleton />;
  }

  if (error || (preferencesResult && !preferencesResult.success)) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Recording Link</h2>
          <p className="text-sm text-muted-foreground">Customize your recording link appearance</p>
        </div>
        <div className="w-full max-w-2xl">
          <SectionError
            title="Failed to load preferences"
            description={
              error instanceof Error
                ? error.message
                : preferencesResult && !preferencesResult.success
                  ? preferencesResult.error.message
                  : 'Something went wrong while loading preferences.'
            }
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Recording Link</h2>
            <p className="text-sm text-muted-foreground">
              Customize your recording link appearance
            </p>
          </div>
          <RecordingLinkPreview
            customizeRecordingLink={customizeRecordingLink}
            headerText={formState.headerText}
            workspaceImage={displayLogoUrl}
            workspaceName={formState.workspaceName}
            footnoteText={formState.footnoteText}
            primaryColor={formState.primaryColor}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-4">
            <CustomizeToggleCard
              enabled={customizeRecordingLink}
              onToggle={handleToggleChange}
              featureEnabled={!!featureGates?.customizeRecordingLink}
              onUpsell={() => triggerUpsell('customizeRecordingLink')}
            />

            {customizeRecordingLink && (
              <>
                <div className="p-6 rounded-xl border bg-card">
                  <div className="flex gap-6">
                    <LogoUploadField
                      workspaceImage={displayLogoUrl}
                      isUploading={uploadLogoMutation.isPending}
                      onUploadClick={() => fileInputRef.current?.click()}
                    />
                    <RecordingLinkTextFields
                      workspaceName={formState.workspaceName}
                      headerText={formState.headerText}
                      footnoteText={formState.footnoteText}
                      primaryColor={formState.primaryColor}
                      onFieldChange={(field, value) =>
                        setFormState((prev) => ({ ...prev, [field]: value }))
                      }
                    />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <AppearanceActionButtons
                    hasChanges={hasChanges}
                    isSaving={isSaving}
                    onCancel={handleCancel}
                    onUpdate={handleUpdate}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
