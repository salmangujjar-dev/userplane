'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { Input } from '@workspace/ui/components/input';
import { Slider } from '@workspace/ui/components/slider';
import { Upload, Pencil } from 'lucide-react';

const DURATION_MARKS = [
  { value: 1, label: '1 min' },
  { value: 2, label: '2 min' },
  { value: 3, label: '3 min' },
  { value: 4, label: '4 min' },
  { value: 5, label: '5 min' },
];

export function AppearanceSection() {
  const [workspaceSlug, setWorkspaceSlug] = useState('larys-workspace');
  const [hideSensitiveFields, setHideSensitiveFields] = useState(false);
  const [enableConsoleNetworkLog, setEnableConsoleNetworkLog] = useState(false);
  const [enableBackendLog, setEnableBackendLog] = useState(false);
  const [customizeRecordingLink, setCustomizeRecordingLink] = useState(false);
  const [workspaceImage, setWorkspaceImage] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Lary's Workspace");
  const [headerText, setHeaderText] = useState('Get ready to record');
  const [footnoteText, setFootnoteText] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(3);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [selectedOption, setSelectedOption] = useState<'screen-voice' | 'screen-only'>(
    'screen-voice'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setWorkspaceSlug(value);
  };

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
              <div className="flex items-center flex-1 min-w-0">
                <span className="text-zinc-500 shrink-0">recorder.userplane.io/r/</span>
                <input
                  id="workspace-slug"
                  value={workspaceSlug}
                  onChange={handleSlugChange}
                  placeholder="your-slug"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 font-semibold text-zinc-900 placeholder:text-zinc-400"
                />
                <Pencil className="h-3.5 w-3.5 text-zinc-400 shrink-0 ml-2" />
              </div>
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
                    <svg
                      viewBox="0 0 512 512"
                      className="h-6 w-6 shrink-0"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M210.09,0c10.56,0,19.12,8.56,19.12,19.12v63.74c0,10.56-8.56,19.12-19.12,19.12s-19.12-8.56-19.12-19.12V19.12C190.97,8.56,199.53,0,210.09,0z M88.22,50.22c7.47-7.47,19.57-7.47,27.04,0l44.62,44.61c7.47,7.47,7.47,19.57,0,27.04c-7.47,7.47-19.57,7.47-27.04,0L88.22,77.26C80.75,69.8,80.75,57.69,88.22,50.22z M331.97,50.22c7.47,7.47,7.47,19.57,0,27.04l-44.62,44.62c-7.47,7.47-19.57,7.47-27.04,0c-7.47-7.47-7.47-19.57,0-27.04l44.62-44.62C312.39,42.75,324.5,42.75,331.97,50.22z M38,172.09c0-10.56,8.56-19.12,19.12-19.12h63.74c10.56,0,19.12,8.56,19.12,19.12c0,10.56-8.56,19.12-19.12,19.12H57.12C46.56,191.21,38,182.65,38,172.09z M190.97,190.88c0-28.73,33.7-44.23,55.51-25.53l215.71,184.9c23.2,19.89,9.99,57.91-20.54,59.13l-97.9,3.92c-10.52,0.42-20.42,5.09-27.44,12.93l-66.66,74.5c-20.58,23-58.69,8.44-58.69-22.42V190.88z" />
                    </svg>
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
                onCheckedChange={setCustomizeRecordingLink}
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
                        <Label htmlFor="workspace-url" className="text-sm font-medium">
                          Recording URL
                        </Label>
                        <div className="flex items-center gap-1 px-3 py-2 rounded-md border border-input bg-background">
                          <span className="text-sm text-muted-foreground">
                            recorder.userplane.io/r/
                          </span>
                          <input
                            id="workspace-url"
                            value={workspaceSlug}
                            onChange={handleSlugChange}
                            placeholder="your-slug"
                            className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-sm font-medium"
                          />
                        </div>
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

                      <div className="space-y-3">
                        <Label htmlFor="recording-duration" className="text-sm font-medium">
                          Recording Duration
                        </Label>
                        <div className="px-4 pt-2">
                          <Slider
                            id="recording-duration"
                            value={[recordingDuration]}
                            onValueChange={(value) => setRecordingDuration(value[0] ?? 1)}
                            min={1}
                            max={5}
                            step={1}
                            className="w-full"
                          />
                          <div className="relative w-full mt-2 h-5">
                            {DURATION_MARKS.map((mark) => (
                              <button
                                key={mark.value}
                                type="button"
                                onClick={() => setRecordingDuration(mark.value)}
                                style={{
                                  left: `${((mark.value - 1) / 4) * 100}%`,
                                }}
                                className={`absolute -translate-x-1/2 text-xs transition-colors ${
                                  recordingDuration === mark.value
                                    ? 'text-foreground font-medium'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {mark.label}
                              </button>
                            ))}
                          </div>
                        </div>
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
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
            <Label htmlFor="hide-sensitive" className="text-sm font-medium cursor-pointer">
              Hide sensitive fields
            </Label>
            <Switch
              id="hide-sensitive"
              checked={hideSensitiveFields}
              onCheckedChange={setHideSensitiveFields}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
            <Label htmlFor="console-network-log" className="text-sm font-medium cursor-pointer">
              Capture console and network logs
            </Label>
            <Switch
              id="console-network-log"
              checked={enableConsoleNetworkLog}
              onCheckedChange={setEnableConsoleNetworkLog}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
            <Label htmlFor="backend-log" className="text-sm font-medium cursor-pointer">
              Capture backend and server logs
            </Label>
            <Switch
              id="backend-log"
              checked={enableBackendLog}
              onCheckedChange={setEnableBackendLog}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
