import Image from 'next/image';
import { addAlpha } from '@/lib/colors';
import { useRecordingLinkPreview } from '@/hooks/use-recording-link-preview';
import { cn } from '@workspace/ui/lib/utils';
import { CSSProperties } from 'react';

interface RecordingLinkPreviewProps {
  customizeRecordingLink: boolean;
  headerText: string;
  workspaceImage: string | null;
  workspaceName: string;
  footnoteText: string;
  primaryColor: string;
}

export function RecordingLinkPreview({
  customizeRecordingLink,
  headerText,
  workspaceImage,
  workspaceName,
  footnoteText,
  primaryColor,
}: RecordingLinkPreviewProps) {
  const { selectedOption, setSelectedOption } = useRecordingLinkPreview();

  const previewStyle = {
    '--primary-color': primaryColor,
    '--primary-color-08': addAlpha(primaryColor, '08'),
    '--primary-color-15': addAlpha(primaryColor, '15'),
  } as CSSProperties;

  return (
    <div
      className="relative rounded-lg border border-zinc-200 bg-linear-to-b from-zinc-100 to-zinc-50 px-3 py-2"
      style={previewStyle}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="flex gap-2">
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
                className={cn(
                  'aspect-square flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:border-opacity-50',
                  !customizeRecordingLink &&
                    selectedOption === 'screen-voice' &&
                    'border-zinc-200 bg-zinc-50/50', // Fallback if no custom color
                  !customizeRecordingLink && selectedOption !== 'screen-voice' && 'border-zinc-200'
                )}
                style={{
                  borderColor:
                    selectedOption === 'screen-voice'
                      ? customizeRecordingLink
                        ? 'var(--primary-color)'
                        : '#000000'
                      : '#e5e7eb',
                  backgroundColor:
                    selectedOption === 'screen-voice'
                      ? customizeRecordingLink
                        ? 'var(--primary-color-08)'
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
                          ? 'var(--primary-color-15)'
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
                            ? 'var(--primary-color)'
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
                        ? 'var(--primary-color)'
                        : '#000000'
                      : '#e5e7eb',
                  backgroundColor:
                    selectedOption === 'screen-only'
                      ? customizeRecordingLink
                        ? 'var(--primary-color-08)'
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
                          ? 'var(--primary-color-15)'
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
                            ? 'var(--primary-color)'
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
                  backgroundColor: customizeRecordingLink ? 'var(--primary-color)' : '#000000',
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
  );
}
