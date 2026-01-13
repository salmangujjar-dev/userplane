/**
 * Post-Recording Review Screen
 * Lets user review recording before submitting
 */

import type { ReactNode } from 'react';
import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';
import VideoPlayer from './VideoPlayer';
import {
  POST_RECORDING_REVIEW_COPY,
  DEFAULT_COMPANY_NAME,
  DEFAULT_PRIMARY_COLOR,
} from '@/constants';
import type { RecordingPreferences } from '@/types/session-preferences';

interface PostRecordingReviewScreenProps {
  /** Video blob URL for preview */
  videoUrl: string;
  /** Recording preferences for branding */
  preferences: RecordingPreferences;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Error message to display inline (for upload failures) */
  errorMessage?: string | null;
  /** Callback when user clicks submit */
  onSubmit?: () => void;
  /** Callback when user clicks start over */
  onStartOver?: () => void;
  /** Optional element for top-right corner (e.g., settings dropdown) */
  settingsElement?: ReactNode;
}

export default function PostRecordingReviewScreen({
  videoUrl,
  preferences,
  isSubmitting = false,
  errorMessage,
  onSubmit,
  onStartOver,
  settingsElement,
}: PostRecordingReviewScreenProps) {
  const handleSubmit = () => {
    if (onSubmit && !isSubmitting) {
      onSubmit();
    }
  };

  const handleStartOver = () => {
    if (onStartOver && !isSubmitting) {
      onStartOver();
    }
  };

  const customizeLink = preferences.customizeLink;
  const primaryColor =
    customizeLink && preferences.primaryColor ? preferences.primaryColor : DEFAULT_PRIMARY_COLOR;

  const getSubmitButtonText = () => {
    if (isSubmitting) return 'Uploading...';
    if (errorMessage) return 'Retry Upload';
    return POST_RECORDING_REVIEW_COPY.submitButton;
  };

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink ? preferences.companyLogoUrl : null}
      workspaceName={customizeLink ? preferences.companyName : DEFAULT_COMPANY_NAME}
      footnoteText={customizeLink ? preferences.footnoteText : null}
      topRightElement={settingsElement}
    >
      <div className="flex flex-col items-center w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4">
          {POST_RECORDING_REVIEW_COPY.title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
          {POST_RECORDING_REVIEW_COPY.subtitle}
        </p>

        <div className="w-full max-w-md mb-6 sm:mb-8">
          <VideoPlayer src={videoUrl} showControls={true} />
        </div>

        {errorMessage && (
          <div className="w-full max-w-md mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full max-w-md h-11 sm:h-12 text-sm sm:text-base font-semibold mb-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          {getSubmitButtonText()}
        </Button>

        <button
          onClick={handleStartOver}
          disabled={isSubmitting}
          className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {POST_RECORDING_REVIEW_COPY.startOverLink}
        </button>
      </div>
    </RecordingScreenLayout>
  );
}
