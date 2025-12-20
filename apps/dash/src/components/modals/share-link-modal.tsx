'use client';

import { useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@workspace/ui/components/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { toast } from '@workspace/ui/components/sonner';
import { Copy, HelpCircle } from 'lucide-react';

interface ShareLinkModalProps {
  link: string;
  open: boolean;
  onClose: () => void;
}

export function ShareLinkModal({ link, open, onClose }: ShareLinkModalProps) {
  useEffect(() => {
    if (open && link) {
      navigator.clipboard
        .writeText(link)
        .then(() => {
          toast.success('Link copied to clipboard');
        })
        .catch(() => {
          toast.error('Failed to copy link');
        });
    }
  }, [open, link]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">
                Link copied, ready to share
              </DialogTitle>
              <div className="flex items-center gap-1.5">
                <DialogDescription className="text-sm text-muted-foreground">
                  Share with anyone to capture their screen
                </DialogDescription>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href="https://userplane.com/docs/sharing-links"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Learn more about sharing links</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <input
            type="text"
            value={link}
            readOnly
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full px-6">
            Cancel
          </Button>
          <Button onClick={handleCopy} className="rounded-full px-6">
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
