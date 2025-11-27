'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Link, Share2 } from 'lucide-react';

interface RecordingDetailNavProps {
  onCopyLink?: () => void;
  onShare?: () => void;
}

export function RecordingDetailNav({ onCopyLink, onShare }: RecordingDetailNavProps) {
  return (
    <nav>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Logo />
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="default" className="rounded-lg" onClick={onCopyLink}>
            <Link className="h-4 w-4 mr-2" />
            Copy link
          </Button>
          <Button variant="default" size="default" className="rounded-lg" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </nav>
  );
}
