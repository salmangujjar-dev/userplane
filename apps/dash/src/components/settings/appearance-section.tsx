'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Upload } from 'lucide-react';
import { useWorkspacePreferences } from '@/hooks/use-workspace-preferences';
import { useWorkspaceId } from '@/stores/workspace';
import { useUpdateToggle, useUpdateAppearance } from '@/queries/use-appearance-mutations';

export function AppearanceSection() {
  const workspaceId = useWorkspaceId();
  const { data: preferences, isLoading } = useWorkspacePreferences();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [customizeRecordingLink, setCustomizeRecordingLink] = useState(false);
  const [workspaceImage, setWorkspaceImage] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footnoteText, setFootnoteText] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [selectedOption, setSelectedOption] = useState<'screen-voice' | 'screen-only'>(
    'screen-voice'
  );

  // Initialize form with API data
  useEffect(() => {
    if (preferences) {
      setCustomizeRecordingLink(preferences.recordingCustomizeLink);
      setWorkspaceImage(preferences.recordingCompanyLogoPath);
      setWorkspaceName(preferences.recordingCompanyName || '');
      setHeaderText(preferences.recordingHeader || '');
      setFootnoteText(preferences.recordingFootnote || '');
      setPrimaryColor(preferences.recordingPrimaryColor || '#000000');
    }
  }, [preferences]);

  const updateToggleMutation = useUpdateToggle(workspaceId, (previousValue) => {
    setCustomizeRecordingLink(previousValue);
  });
  const updateAppearanceMutation = useUpdateAppearance(workspaceId);

  // Check if form has changes (excluding toggle, which auto-saves)
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkspaceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleChange = (enabled: boolean) => {
    setCustomizeRecordingLink(enabled);
    updateToggleMutation.mutate(enabled);
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
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">Customize your recording link appearance</p>
        </div>
        <div className="w-full max-w-2xl space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Customize your recording link appearance
            </p>
          </div>
          <div className="relative rounded-lg border border-zinc-200 bg-linear-to-b from-zinc-100 to-zinc-50 px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-zinc-200 text-sm">
              <svg
                className="h-4 w-4 text-zinc-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-zinc-500">recorder.userplane.io</span>
            </div>
            <div className="mt-2 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center bg-white">
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg border p-10">
                <div className="text-center space-y-8">
                  <h1 className="text-2xl font-semibold">
                    {customizeRecordingLink ? headerText : 'Get ready to record'}
                  </h1>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedOption('screen-voice')}
                      className="aspect-square flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:border-opacity-50"
                      style={{
                        borderColor:
                          selectedOption === 'screen-voice'
                            ? customizeRecordingLink
                              ? primaryColor
                              : '#000000'
                            : '#e5e7eb',
                        backgroundColor:
                          selectedOption === 'screen-voice'
                            ? customizeRecordingLink
                              ? `${primaryColor}08`
                              : '#00000008'
                            : 'transparent',
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                        style={{
                          backgroundColor:
                            selectedOption === 'screen-voice'
                              ? customizeRecordingLink
                                ? `${primaryColor}15`
                                : '#00000015'
                              : '#f3f4f6',
                        }}
                      >
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            color:
                              selectedOption === 'screen-voice'
                                ? customizeRecordingLink
                                  ? primaryColor
                                  : '#000000'
                                : '#374151',
                          }}
                        >
                          <path d="M23 7l-7 5 7 5V7z" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">Screen + voice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOption('screen-only')}
                      className="aspect-square flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:border-opacity-50"
                      style={{
                        borderColor:
                          selectedOption === 'screen-only'
                            ? customizeRecordingLink
                              ? primaryColor
                              : '#000000'
                            : '#e5e7eb',
                        backgroundColor:
                          selectedOption === 'screen-only'
                            ? customizeRecordingLink
                              ? `${primaryColor}08`
                              : '#00000008'
                            : 'transparent',
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                        style={{
                          backgroundColor:
                            selectedOption === 'screen-only'
                              ? customizeRecordingLink
                                ? `${primaryColor}15`
                                : '#00000015'
                              : '#f3f4f6',
                        }}
                      >
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          style={{
                            color:
                              selectedOption === 'screen-only'
                                ? customizeRecordingLink
                                  ? primaryColor
                                  : '#000000'
                                : '#374151',
                          }}
                        >
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <path d="M8 21h8" strokeLinecap="round" />
                          <path d="M12 17v4" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">Screen only</span>
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      className="px-16 py-3 text-white rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: customizeRecordingLink ? primaryColor : '#000000',
                      }}
                    >
                      Start Recording
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {customizeRecordingLink ? (
                  <>
                    {workspaceImage && (
                      // TODO: unoptimized for now - base64 data URLs cannot use Next.js optimization
                      <Image
                        src={workspaceImage}
                        alt="Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                        unoptimized
                      />
                    )}
                    <span className="text-sm font-medium" style={{ color: '#000' }}>
                      {workspaceName}
                    </span>
                  </>
                ) : (
                  <>
                    <Image
                      src="/logo-dark.svg"
                      alt="Userplane"
                      width={24}
                      height={24}
                      className="h-6 w-6 shrink-0"
                    />
                    <span className="text-sm font-medium" style={{ color: '#000' }}>
                      Userplane
                    </span>
                  </>
                )}
              </div>

              {customizeRecordingLink && footnoteText && (
                <p className="mt-4 text-xs text-center" style={{ color: '#666' }}>
                  {footnoteText}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
              <Label
                htmlFor="customize-recording-link"
                className="text-sm font-medium cursor-pointer"
              >
                Customize recording link
              </Label>
              <Switch
                id="customize-recording-link"
                checked={customizeRecordingLink}
                onCheckedChange={handleToggleChange}
                disabled={updateToggleMutation.isPending}
              />
            </div>

            {customizeRecordingLink && (
              <>
                <div className="p-4 rounded-xl border bg-card">
                  <div className="flex gap-6">
                    <div className="shrink-0">
                      <Label className="text-sm font-medium">Company Image</Label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-24 h-24 mt-2 rounded-lg border-2 border-dashed border-input hover:border-primary hover:bg-accent transition-colors flex flex-col items-center justify-center gap-1 overflow-hidden"
                      >
                        {workspaceImage ? (
                          // TODO: unoptimized for now - base64 data URLs cannot use Next.js optimization
                          <Image
                            src={workspaceImage}
                            alt="Workspace"
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            unoptimized
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

                  {hasChanges && (
                    <div className="flex gap-3 justify-end pt-4 mt-6">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateAppearanceMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpdate} disabled={updateAppearanceMutation.isPending}>
                        {updateAppearanceMutation.isPending ? 'Saving...' : 'Update'}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
