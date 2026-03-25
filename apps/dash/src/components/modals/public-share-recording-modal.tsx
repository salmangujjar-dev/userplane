'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import Logo from '@userplane/ui/components/logo';
import { Clock, Link as LinkIcon } from 'lucide-react';

import { showCopiedToClipboardToast, showCopyFailedToast } from '@/lib/toasts';

function formatExpiryDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PublicShareRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  expiresAt: Date;
}

export function PublicShareRecordingModal({
  open,
  onOpenChange,
  shareUrl,
  expiresAt,
}: PublicShareRecordingModalProps) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showCopiedToClipboardToast('Recording link');
    } catch {
      showCopyFailedToast();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Share recording</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Share this recording via link
              </DialogDescription>
            </div>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <label htmlFor="public-share-link" className="text-sm font-medium">
              Public share link
            </label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-muted px-4 py-2.5">
                <input
                  id="public-share-link"
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="px-4 py-2.5 h-auto"
                onClick={handleCopyLink}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Expires on {formatExpiryDate(expiresAt)}
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="secondary" className="px-6" onClick={handleCopyLink}>
              Copy
            </Button>
            <Button type="button" className="px-6" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
