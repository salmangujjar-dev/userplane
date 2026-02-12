/**
 * Post-Recording Review Screen
 * Lets user review recording before submitting
 */

import { Button } from '@workspace/ui/components/button';
import { type ReactNode, useState } from 'react';

import {
  DEFAULT_COMPANY_NAME,
  DEFAULT_PRIMARY_COLOR,
  POST_RECORDING_REVIEW_COPY,
} from '@/constants';
import type { RecordingPreferences } from '@/types/session-preferences';

import RecordingScreenLayout from './RecordingScreenLayout';
import VideoPlayer from './VideoPlayer';

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
  onSubmit?: (notes?: string) => void;
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
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (onSubmit && !isSubmitting) {
      const trimmed = notes.trim();
      onSubmit(trimmed || undefined);
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

        <div className="w-full max-w-md mb-3 sm:mb-4">
          <VideoPlayer src={videoUrl} showControls={true} />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share additional context (optional)"
            disabled={isSubmitting}
            className={`w-full mt-2 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border focus:border-gray-300 focus:ring-1 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${notes ? 'border border-gray-300' : 'border border-transparent'}`}
          />
        </div>

        <div className="w-full max-w-md flex flex-col items-center">
          {errorMessage && (
            <div className="w-full mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold mb-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </RecordingScreenLayout>
  );
}
