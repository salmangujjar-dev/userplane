/**
 * Post-Recording Acknowledgment Screen
 * Shows success message after upload completes
 */

import RecordingScreenLayout from './RecordingScreenLayout';
import { POST_RECORDING_ACK_COPY } from '@/constants/screen-copy';

interface PostRecordingAckScreenProps {
  thumbnailUrl?: string;
}

export default function PostRecordingAckScreen({ thumbnailUrl }: PostRecordingAckScreenProps) {
  return (
    <RecordingScreenLayout>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <img src="/checkmark.svg" alt="Success" className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{POST_RECORDING_ACK_COPY.title}</h1>
        <p className="text-gray-600 mb-2">{POST_RECORDING_ACK_COPY.subtitle}</p>
        <p className="text-sm text-gray-500 mb-8">{POST_RECORDING_ACK_COPY.closeInfo}</p>

        {thumbnailUrl && (
          <div className="w-full max-w-md">
            <div className="aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden bg-gray-100">
              <img
                src={thumbnailUrl}
                alt="Recording preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </RecordingScreenLayout>
  );
}
