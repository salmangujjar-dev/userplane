/**
 * Post-Recording Upload Screen
 * Shows upload progress
 */

import RecordingScreenLayout from './RecordingScreenLayout';
import { POST_RECORDING_UPLOAD_COPY } from '@/constants/screen-copy';

interface PostRecordingUploadScreenProps {
  thumbnailUrl?: string;
  progress: number;
}

export default function PostRecordingUploadScreen({
  thumbnailUrl,
  progress,
}: PostRecordingUploadScreenProps) {
  return (
    <RecordingScreenLayout>
      <h1 className="text-3xl font-bold text-center mb-4">{POST_RECORDING_UPLOAD_COPY.title}</h1>
      <p className="text-gray-600 text-center mb-8">{POST_RECORDING_UPLOAD_COPY.subtitle}</p>

      <div className="w-full max-w-md mb-6">
        <div className="aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden bg-gray-100">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Recording preview"
              className="w-full h-full object-cover opacity-75"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img src="/video.svg" alt="Recording" className="w-16 h-16 opacity-50" />
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Uploading</span>
          <span className="text-sm font-medium text-gray-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gray-900 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </RecordingScreenLayout>
  );
}
