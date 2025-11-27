'use client';

import { RecordingDetailNav } from '@/components/recording-detail-nav';
import { RecordingPlayer } from '@/components/recording-player';
import { RecordingMetaPanel } from '@/components/recording-meta-panel';
import { RecordingLogReplayPanel } from '@/components/recording-log-replay-panel';

export default function RecordingDetailPage() {
  const handleCopyLink = () => {
    console.log('Copy link to clipboard');
  };

  const handleShare = () => {
    console.log('Open share modal');
  };

  return (
    <div className="min-h-svh bg-background">
      <RecordingDetailNav onCopyLink={handleCopyLink} onShare={handleShare} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <RecordingPlayer />
            <RecordingMetaPanel />
          </div>

          <div className="lg:col-span-1">
            <RecordingLogReplayPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
