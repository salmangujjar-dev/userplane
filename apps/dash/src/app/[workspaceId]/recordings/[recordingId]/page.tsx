'use client';

import { useState } from 'react';
import { RecordingDetailNav } from '@/components/navigation/recording-detail-nav';
import { RecordingPlayer } from '@/components/recordings/recording-player';
import { RecordingMetaPanel } from '@/components/recordings/recording-meta-panel';
import { RecordingLogReplayPanel } from '@/components/recordings/recording-log-replay-panel';
import { PlaybackOptions } from '@/components/player/PlaybackOptions';
import type { Player } from '@/components/player/types';
import { toast } from '@workspace/ui/components/sonner';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@workspace/ui/components/resizable';

export default function RecordingDetailPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareLink = async () => {
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

  const handleShareAtTimestamp = async () => {
    // TODO: Get current timestamp from video player
    const currentUrl = window.location.href;
    const urlWithTimestamp = `${currentUrl}?t=00:00`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share Your Screen at 00:00',
          text: 'Submit a Screen Capture at timestamp',
          url: urlWithTimestamp,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share link');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(urlWithTimestamp);
        toast.success('Link with timestamp copied to clipboard');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="min-h-svh bg-background">
      <RecordingDetailNav
        onCopyLink={handleCopyLink}
        onShareLink={handleShareLink}
        onShareAtTimestamp={handleShareAtTimestamp}
      />

      <main className="w-full px-6 py-8">
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-8rem)] rounded-lg">
          <ResizablePanel defaultSize={66} minSize={30}>
            <div className="relative pr-4 space-y-6">
              {/* Settings button positioned in the outer container */}
              <div className="absolute top-4 right-8 z-50">
                <PlaybackOptions player={player} />
              </div>

              <RecordingPlayer onPlayerReady={setPlayer} />
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
