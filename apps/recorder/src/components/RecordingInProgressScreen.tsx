/**
 * Recording In Progress Screen
 * Shows live preview and recording indicator
 */

import { useEffect, useRef } from 'react';
import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';
import { RECORDING_IN_PROGRESS_COPY } from '@/constants/screen-copy';

interface RecordingInProgressScreenProps {
  title?: string;
  subtitle?: string;
  mediaStream?: MediaStream | null;
  onStopRecording?: () => void;
}

export default function RecordingInProgressScreen({
  title = RECORDING_IN_PROGRESS_COPY.title,
  subtitle = RECORDING_IN_PROGRESS_COPY.subtitle,
  mediaStream,
  onStopRecording,
}: RecordingInProgressScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log('[RecordingInProgress] Setting up video preview');
    console.log('[RecordingInProgress] Media stream:', mediaStream ? 'Available' : 'Not available');

    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((err) => {
        console.error('[RecordingInProgress] Failed to play video preview:', err);
      });
      console.log('[RecordingInProgress] Video preview started');
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [mediaStream]);

  const handleStopRecording = () => {
    if (onStopRecording) {
      onStopRecording();
    }
  };

  return (
    <RecordingScreenLayout>
      <h1 className="text-3xl font-bold text-center mb-4">{title}</h1>
      <p className="text-gray-600 text-center mb-8">{subtitle}</p>

      {mediaStream ? (
        <div className="w-full max-w-md mb-8">
          <div className="relative aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden bg-black shadow-lg">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full shadow-md">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-semibold">REC</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-12">
          <img src="/video.svg" alt="Recording" className="w-24 h-24 text-gray-800" />
        </div>
      )}

      <Button
        onClick={handleStopRecording}
        className="w-full max-w-md h-12 text-base font-semibold"
      >
        {RECORDING_IN_PROGRESS_COPY.stopButton}
      </Button>
    </RecordingScreenLayout>
  );
}
