'use client';

import { RecordingDetailNav } from '@/components/navigation/recording-detail-nav';
import { RecordingPlayer } from '@/components/recordings/recording-player';
import { RecordingMetaPanel } from '@/components/recordings/recording-meta-panel';
import { RecordingLogReplayPanel } from '@/components/recordings/recording-log-replay-panel';
import { toast } from '@workspace/ui/components/sonner';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@workspace/ui/components/resizable';

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
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-8rem)] rounded-lg">
          <ResizablePanel defaultSize={66} minSize={30}>
            <div className="pr-4 space-y-6">
              <RecordingPlayer />
              <RecordingMetaPanel />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={34} minSize={25}>
            <div className="pl-4">
              <RecordingLogReplayPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
