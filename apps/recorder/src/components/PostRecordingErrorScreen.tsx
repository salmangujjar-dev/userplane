/**
 * Post-Recording Error Screen
 * Shown when upload or processing fails
 */

import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';
import { POST_RECORDING_ERROR_COPY } from '@/constants/copy';
import type { RecordingPreferences } from '@/types/session-preferences';

interface PostRecordingErrorScreenProps {
  /** Error title */
  title: string;
  /** Error description */
  subtitle: string;
  /** Recording preferences for branding */
  preferences?: RecordingPreferences;
  /** Whether the error is recoverable with retry */
  canRetry?: boolean;
  /** Callback when user clicks retry (only shown if canRetry is true) */
  onRetry?: () => void;
  /** Callback when user clicks start over */
  onStartOver: () => void;
}

export default function PostRecordingErrorScreen({
  title,
  subtitle,
  preferences,
  canRetry = false,
  onRetry,
  onStartOver,
}: PostRecordingErrorScreenProps) {
  const customizeLink = preferences?.customizeLink || false;
  const primaryColor =
    customizeLink && preferences?.primaryColor ? preferences.primaryColor : '#000000';

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink && preferences ? preferences.companyLogoUrl : null}
      workspaceName={customizeLink && preferences ? preferences.companyName : 'Userplane'}
      footnoteText={customizeLink && preferences ? preferences.footnoteText : null}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8 max-w-md">{subtitle}</p>

        {canRetry && onRetry ? (
          <>
            <Button
              onClick={onRetry}
              className="w-full max-w-md h-12 text-base font-semibold text-white mb-3"
              style={{
                backgroundColor: primaryColor,
              }}
            >
              Try Again
            </Button>
            <button
              onClick={onStartOver}
              className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              Start from scratch
            </button>
          </>
        ) : (
          <Button
            onClick={onStartOver}
            className="w-full max-w-md h-12 text-base font-semibold text-white"
            style={{
              backgroundColor: primaryColor,
            }}
          >
            {POST_RECORDING_ERROR_COPY.startOverButton}
          </Button>
        )}
      </div>
    </RecordingScreenLayout>
  );
}
