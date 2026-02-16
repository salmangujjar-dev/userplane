'use client';

import { getFeatureGates, type PlanId } from '@workspace/pricing';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { cn } from '@workspace/ui/lib/utils';
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
import { showPromise } from '@/lib/toasts';
import { useWorkspaceId } from '@/stores/workspace';

import { RecordingLinkPreview } from './recording-link-preview';

export function RecordingLinkSection() {
  const workspaceId = useWorkspaceId();
  const { data: preferencesResult, isLoading, error, refetch } = useWorkspacePreferences();
  const { data: subscriptionResult } = useSubscriptionStatus();
  const subscriptionData = subscriptionResult?.success ? subscriptionResult.data : null;
  const effectivePlanId = (subscriptionData?.accessDetail.effectivePlanId ?? 'free') as PlanId;
  const featureGates = getFeatureGates(effectivePlanId);
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
  const [workspaceImage, setWorkspaceImage] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footnoteText, setFootnoteText] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');

  // Track if toggle should sync from server
  const shouldSyncToggleRef = useRef(true);

  // Initialize form with API data
  useEffect(() => {
    if (preferences) {
      // Only sync toggle when allowed (initial load or after error)
      if (shouldSyncToggleRef.current) {
        setCustomizeRecordingLink(preferences.recordingCustomizeLink);
        shouldSyncToggleRef.current = false;
      }
      // Always sync other fields
      setWorkspaceImage(preferences.recordingCompanyLogoPath);
      setWorkspaceName(preferences.recordingCompanyName || '');
      setHeaderText(preferences.recordingHeader || '');
      setFootnoteText(preferences.recordingFootnote || '');
      setPrimaryColor(preferences.recordingPrimaryColor || '#000000');
    }
  }, [preferences, setCustomizeRecordingLink]);

  const updateAppearanceMutation = useUpdateAppearance(workspaceId);
  const uploadLogoMutation = useUploadWorkspaceLogo(workspaceId);

  // Check if form has changes (excluding toggle, which auto-saves)
  // Note: workspaceImage is now a CDN URL, not base64
  const hasChanges = useMemo(() => {
    if (!preferences) return false;

    return (
      workspaceName !== (preferences.recordingCompanyName || '') ||
      headerText !== (preferences.recordingHeader || '') ||
      footnoteText !== (preferences.recordingFootnote || '') ||
      primaryColor !== (preferences.recordingPrimaryColor || '#000000') ||
      workspaceImage !== preferences.recordingCompanyLogoPath
    );
  }, [preferences, workspaceName, headerText, footnoteText, primaryColor, workspaceImage]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const promise = uploadLogoMutation.mutateAsync(file);
      showPromise(promise, {
        loading: 'Uploading logo...',
        success: 'Logo uploaded successfully',
        error: 'Failed to upload logo',
      });
      const result = await promise;
      setWorkspaceImage(result.url);
    } catch {
      // Error already handled by toast.promise
    } finally {
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdate = () => {
    updateAppearanceMutation.mutate({
      recordingCompanyName: workspaceName || null,
      recordingCompanyLogoPath: workspaceImage,
      recordingHeader: headerText || null,
      recordingFootnote: footnoteText || null,
      recordingPrimaryColor: primaryColor,
    });
  };

  const handleCancel = () => {
    // Reset form to original values
    if (preferences) {
      setCustomizeRecordingLink(preferences.recordingCustomizeLink);
      setWorkspaceImage(preferences.recordingCompanyLogoPath);
      setWorkspaceName(preferences.recordingCompanyName || '');
      setHeaderText(preferences.recordingHeader || '');
      setFootnoteText(preferences.recordingFootnote || '');
      setPrimaryColor(preferences.recordingPrimaryColor || '#000000');
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
            headerText={headerText}
            workspaceImage={workspaceImage}
            workspaceName={workspaceName}
            footnoteText={footnoteText}
            primaryColor={primaryColor}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-4">
            <div
              className={cn(
                'flex items-center justify-between p-6 rounded-xl border bg-card',
                !featureGates.customizeWorkspace && 'cursor-pointer'
              )}
              onClick={
                !featureGates.customizeWorkspace
                  ? () => triggerUpsell('customizeWorkspace')
                  : undefined
              }
            >
              <Label
                htmlFor={featureGates.customizeWorkspace ? 'customize-recording-link' : undefined}
                className={cn(
                  'text-sm font-medium',
                  featureGates.customizeWorkspace
                    ? 'cursor-pointer'
                    : 'text-muted-foreground cursor-pointer'
                )}
              >
                Customize recording link
              </Label>
              <span className={cn(!featureGates.customizeWorkspace && 'pointer-events-none')}>
                <Switch
                  id="customize-recording-link"
                  checked={customizeRecordingLink}
                  onCheckedChange={handleToggleChange}
                  disabled={!featureGates.customizeWorkspace}
                />
              </span>
            </div>

            {customizeRecordingLink && (
              <>
                <div className="p-6 rounded-xl border bg-card">
                  <div className="flex gap-6">
                    <div className="shrink-0">
                      <Label className="text-sm font-medium">Company Image</Label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadLogoMutation.isPending}
                        className="relative w-24 h-24 mt-2 rounded-lg border-2 border-dashed border-input hover:border-primary hover:bg-accent transition-colors flex flex-col items-center justify-center gap-1 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadLogoMutation.isPending ? (
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
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="workspace-name" className="text-sm font-medium">
                          Company Name
                        </Label>
                        <Input
                          id="workspace-name"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
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
                          onChange={(e) => setHeaderText(e.target.value)}
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
                          onChange={(e) => setFootnoteText(e.target.value)}
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
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-10 w-20 rounded border border-input cursor-pointer"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

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
                        onClick={handleCancel}
                        disabled={updateAppearanceMutation.isPending}
                        tabIndex={hasChanges ? 0 : -1}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdate}
                        disabled={updateAppearanceMutation.isPending}
                        tabIndex={hasChanges ? 0 : -1}
                      >
                        {updateAppearanceMutation.isPending ? 'Saving...' : 'Update'}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
