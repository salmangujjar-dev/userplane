'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { toast } from '@workspace/ui/components/sonner';

interface ShareLinkModalProps {
  link: string;
  open: boolean;
  onClose: () => void;
}

export function ShareLinkModal({ link, open, onClose }: ShareLinkModalProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <div className="space-y-3">
          <div className="space-y-1">
            <DialogTitle className="text-base font-semibold">Share link</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Share recording link
            </DialogDescription>
          </div>
          <div className="w-full rounded-lg bg-muted px-4 py-2.5">
            <input
              id="link"
              type="text"
              value={link}
              readOnly
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-full px-6 w-full sm:w-auto"
          >
            Share link
          </Button>
          <Button onClick={handleCopy} className="rounded-full px-6 w-full sm:w-auto">
            Copy Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
