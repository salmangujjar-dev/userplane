/**
 * Post-Recording Review Screen
 * Lets user review recording before submitting
 */

import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';
import { POST_RECORDING_REVIEW_COPY } from '@/constants/screen-copy';

interface PostRecordingReviewScreenProps {
  title?: string;
  subtitle?: string;
  thumbnailUrl?: string;
  onSubmit?: () => void;
  onStartOver?: () => void;
}

export default function PostRecordingReviewScreen({
  title = POST_RECORDING_REVIEW_COPY.title,
  subtitle = POST_RECORDING_REVIEW_COPY.subtitle,
  thumbnailUrl,
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

  return (
    <RecordingScreenLayout>
      <h1 className="text-3xl font-bold text-center mb-4">{title}</h1>
      <p className="text-gray-600 text-center mb-8">{subtitle}</p>

      <div className="w-full max-w-md mb-6">
        <div className="aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden bg-gray-100">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Recording preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img src="/video.svg" alt="Recording" className="w-16 h-16 opacity-50" />
            </div>
          )}
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full max-w-md h-12 text-base font-semibold mb-3">
        {POST_RECORDING_REVIEW_COPY.submitButton}
      </Button>

      <button
        onClick={handleStartOver}
        className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
      >
        {POST_RECORDING_REVIEW_COPY.startOverLink}
      </button>
    </RecordingScreenLayout>
  );
}
