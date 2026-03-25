'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import { HelpCircle } from 'lucide-react';

import { DomainCodeSnippet } from '@/components/domains/domain-code-snippet';
import { DomainVerificationHeader } from '@/components/domains/domain-verification-header';
import { SUPPORT_LINKS } from '@/constants';

interface DomainVerificationPreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainUrl: string;
  workspaceId: string;
  onVerify?: () => void;
}

export function DomainVerificationPreModal({
  open,
  onOpenChange,
  domainUrl,
  workspaceId,
  onVerify,
}: DomainVerificationPreModalProps) {
  const handleHowItWorks = () => {
    window.open(SUPPORT_LINKS.domainVerification, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <DomainVerificationHeader />

            <div className="text-center space-y-1">
              <DialogTitle className="text-xl font-semibold">Verify your domain</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add code snippet to capture logs
              </DialogDescription>
            </div>
          </div>

          <DomainCodeSnippet workspaceId={workspaceId} domainUrl={domainUrl} />
        </div>

        <DialogFooter className="mt-8">
          <button
            type="button"
            onClick={handleHowItWorks}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
          >
            <HelpCircle className="h-4 w-4" />
            How it works
          </button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" className="px-6" onClick={onVerify}>
              Verify
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
