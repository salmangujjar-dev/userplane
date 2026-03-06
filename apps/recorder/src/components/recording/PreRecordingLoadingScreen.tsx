/**
 * Pre-Recording Loading Screen
 * Shown while initializing session
 */

import { useEffect, useState } from 'react';

import RecordingScreenLayout from './RecordingScreenLayout';

const RETRY_DELAY_MS = 8_000;

export default function PreRecordingLoadingScreen() {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <RecordingScreenLayout>
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Setting things up</h1>
        <p className="text-gray-600">This will only take a moment</p>
        {showRetry && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Taking too long? Try again
          </button>
        )}
      </div>
    </RecordingScreenLayout>
  );
}
