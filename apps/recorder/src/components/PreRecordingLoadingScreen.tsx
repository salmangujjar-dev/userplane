/**
 * Pre-Recording Loading Screen
 * Shown while initializing session
 */

import RecordingScreenLayout from './RecordingScreenLayout';

export default function PreRecordingLoadingScreen() {
  return (
    <RecordingScreenLayout>
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Setting things up</h1>
        <p className="text-gray-600">This will only take a moment</p>
      </div>
    </RecordingScreenLayout>
  );
}
