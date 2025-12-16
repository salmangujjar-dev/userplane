/**
 * Pre-Recording Error Screen
 * Shown when session initialization fails
 */

import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';

interface PreRecordingErrorScreenProps {
  title: string;
  subtitle: string;
  actionTitle: string;
  onAction: () => void;
}

export default function PreRecordingErrorScreen({
  title,
  subtitle,
  actionTitle,
  onAction,
}: PreRecordingErrorScreenProps) {
  return (
    <RecordingScreenLayout>
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

        <Button onClick={onAction} className="w-full max-w-md h-12 text-base font-semibold">
          {actionTitle}
        </Button>
      </div>
    </RecordingScreenLayout>
  );
}
