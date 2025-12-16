/**
 * Post-Recording Review Screen
 * Lets user review recording before submitting
 */

import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';
import { POST_RECORDING_REVIEW_COPY } from '@/constants/screen-copy';
import type { UIPreferences } from '@/types/session-preferences';

interface PostRecordingReviewScreenProps {
  title?: string;
  subtitle?: string;
  thumbnailUrl?: string;
  workspaceLogoUrl?: string | null;
  workspaceName?: string | null;
  preferences: UIPreferences;
  onSubmit?: () => void;
  onStartOver?: () => void;
}

export default function PostRecordingReviewScreen({
  title = POST_RECORDING_REVIEW_COPY.title,
  subtitle = POST_RECORDING_REVIEW_COPY.subtitle,
  thumbnailUrl,
  workspaceLogoUrl,
  workspaceName,
  preferences,
  onSubmit,
  onStartOver,
}: PostRecordingReviewScreenProps) {
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  const handleStartOver = () => {
    if (onStartOver) {
      onStartOver();
    }
  };

  const customizeLink = preferences.customizeLink;
  const primaryColor =
    customizeLink && preferences.primaryColor ? preferences.primaryColor : '#000000';

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink ? workspaceLogoUrl : null}
      workspaceName={customizeLink ? workspaceName : 'Userplane'}
      footnoteText={customizeLink ? preferences.footnoteText : null}
    >
      <div className="flex flex-col items-center w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">{subtitle}</p>

        <div className="w-full max-w-md mb-6 sm:mb-8">
          <div className="aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden bg-gray-100">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="Recording preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src="/video.svg"
                  alt="Recording"
                  className="w-12 h-12 sm:w-16 sm:h-16 opacity-50"
                />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full max-w-md h-11 sm:h-12 text-sm sm:text-base font-semibold mb-3 text-white"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          {POST_RECORDING_REVIEW_COPY.submitButton}
        </Button>

        <button
          onClick={handleStartOver}
          className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          {POST_RECORDING_REVIEW_COPY.startOverLink}
        </button>
      </div>
    </RecordingScreenLayout>
  );
}
