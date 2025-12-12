'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Spinner } from '@workspace/ui/components/spinner';
import { ArrowLeftRight, Globe } from 'lucide-react';

interface DomainVerificationVerifyingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DomainVerificationVerifyingModal({
  open,
  onOpenChange,
}: DomainVerificationVerifyingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-4">
              <Image
                src="/logo-dark.svg"
                alt="Userplane"
                width={56}
                height={56}
                className="h-14 w-14 shrink-0"
              />
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
                <Globe className="h-8 w-8" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <DialogTitle className="text-xl font-semibold">Verify your domain</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add code snippet to capture logs
              </DialogDescription>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-foreground">Loading</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
