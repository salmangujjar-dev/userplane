'use client';

import type { ViewSharedRecordingData } from '@userplane/contract';
import { Button } from '@userplane/ui/components/button';
import Logo from '@userplane/ui/components/logo';
import { ArrowUpRight, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { fetchSharedRecording } from '@/client/public';
import { PublicShareRecordingModal } from '@/components/modals/public-share-recording-modal';
import { RecordingLayout } from '@/components/recordings/recording-layout';
import { RecordingLogReplayPanel } from '@/components/recordings/recording-log-replay-panel';
import { RecordingPlayer } from '@/components/recordings/recording-player';
import { RecordingPlayerProvider } from '@/components/recordings/recording-player-context';
import { useConsoleErrorMarkers } from '@/components/recordings/use-console-error-markers';
import { ErrorView } from '@/components/shared/error-view';
import { NotFoundPage } from '@/components/shared/not-found-page';
import { RecordingDetailSkeleton } from '@/components/skeleton';

type ShareState =
  | { status: 'loading' }
  | { status: 'success'; data: ViewSharedRecordingData }
  | { status: 'expired' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

function SharedRecordingNav({ onShare }: { onShare: () => void }) {
  return (
    <nav>
      <div className="flex w-full items-center justify-between px-6 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="default" className="rounded-full" asChild>
            <Link href="/auth">
              Join
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="default" size="default" className="rounded-full" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </nav>
  );
}

function RecordingContent({
  recording,
  resources,
}: {
  recording: ViewSharedRecordingData['recording'];
  resources: ViewSharedRecordingData['resources'];
}) {
  const markers = useConsoleErrorMarkers(
    null,
    recording.recordingId,
    recording,
    resources.consoleLog.url ?? undefined
  );

  return (
    <RecordingPlayerProvider>
      <RecordingLayout
        player={
          <RecordingPlayer
            videoSources={resources.video.sources ?? []}
            thumbnailUrl={resources.thumbnail.url}
            durationMs={recording.recordingDurationMs}
            markers={markers}
          />
        }
        panel={
          <RecordingLogReplayPanel
            recordingId={recording.recordingId}
            recording={recording}
            resources={{
              consoleLog: resources.consoleLog,
              networkLog: resources.networkLog,
              action: resources.action,
            }}
          />
        }
      />
    </RecordingPlayerProvider>
  );
}

export default function SharedRecordingPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<ShareState>({ status: 'loading' });
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'No share token provided' });
      return;
    }

    let cancelled = false;

    async function load() {
      const result = await fetchSharedRecording(token!);
      if (cancelled) return;

      if (result.success) {
        setState({ status: 'success', data: result.data });
      } else if (result.error.code === 'SHARE_TOKEN_EXPIRED') {
        setState({ status: 'expired' });
      } else if (
        result.error.code === 'RECORDING_NOT_FOUND' ||
        result.error.code === 'RECORDING_GONE' ||
        result.error.status === 410
      ) {
        setState({ status: 'not_found' });
      } else {
        setState({ status: 'error', message: result.error.message });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <RecordingDetailSkeleton />
      </div>
    );
  }

  if (state.status === 'not_found') {
    return <NotFoundPage />;
  }

  if (state.status === 'expired') {
    return (
      <ErrorView
        title="Recording link expired"
        description="This shared recording link has expired. Contact the person who shared it to request a new link."
      />
    );
  }

  if (state.status === 'error') {
    return <ErrorView title="Something went wrong" description={state.message} />;
  }

  const { recording, resources, expiresAt } = state.data;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="h-screen bg-background flex flex-col">
      <SharedRecordingNav onShare={() => setShowShareModal(true)} />
      <RecordingContent recording={recording} resources={resources} />

      <PublicShareRecordingModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        shareUrl={shareUrl}
        expiresAt={expiresAt}
      />
    </div>
  );
}
