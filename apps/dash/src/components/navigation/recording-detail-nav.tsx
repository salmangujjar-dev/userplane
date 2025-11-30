'use client';

import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Link as LinkIcon, Share2 } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace';

interface RecordingDetailNavProps {
  onCopyLink?: () => void;
  onShare?: () => void;
}

export function RecordingDetailNav({ onCopyLink, onShare }: RecordingDetailNavProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  return (
    <nav>
      <div className="flex w-full items-center justify-between px-6 py-4">
        <Link href={`/${workspaceId}`}>
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="default" className="rounded-full" onClick={onCopyLink}>
            Copy link
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button variant="default" size="default" className="rounded-full" onClick={onShare}>
            Share at 00:00
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
