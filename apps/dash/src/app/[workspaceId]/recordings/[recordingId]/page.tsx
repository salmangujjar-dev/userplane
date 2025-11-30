'use client';

import { RecordingDetailNav } from '@/components/navigation/recording-detail-nav';
import { RecordingPlayer } from '@/components/recordings/recording-player';
import { RecordingMetaPanel } from '@/components/recordings/recording-meta-panel';
import { RecordingLogReplayPanel } from '@/components/recordings/recording-log-replay-panel';
import { toast } from '@workspace/ui/components/sonner';

export default function RecordingDetailPage() {
  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share Your Screen',
          text: 'Submit a Screen Capture',
          url: currentUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share link');
        }
      }
    } else {
      await handleCopyLink();
    }
  };

  return (
    <div className="min-h-svh bg-background">
      <RecordingDetailNav onCopyLink={handleCopyLink} onShare={handleShare} />

      <main className="w-full px-6 py-8">
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
