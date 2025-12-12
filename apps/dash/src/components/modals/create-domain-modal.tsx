'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { HelpCircle } from 'lucide-react';

interface CreateDomainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDomain: (domainUrl: string) => void;
}

export function CreateDomainModal({ open, onOpenChange, onCreateDomain }: CreateDomainModalProps) {
  const [domainUrl, setDomainUrl] = useState('');

  useEffect(() => {
    if (!open) {
      setDomainUrl('');
    }
  }, [open]);

  const handleCreate = () => {
    const isValid = domainUrl.trim();

    if (isValid) {
      onCreateDomain(domainUrl);
      setDomainUrl('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setDomainUrl('');
    onOpenChange(false);
  };

  const isFormValid = domainUrl.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <Image
              src="/logo-dark.svg"
              alt="Userplane"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0"
            />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Add New Domain</DialogTitle>
              <div className="flex items-center gap-1.5">
                <DialogDescription className="text-sm text-muted-foreground">
                  Add a new domain for recording sessions
                </DialogDescription>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href="https://userplane.com/docs/domains"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Learn more about domains</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain-url" className="text-sm">
                Domain URL
              </Label>
              <Input
                id="domain-url"
                value={domainUrl}
                onChange={(e) => setDomainUrl(e.target.value)}
                placeholder="example.com"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleCreate}
              disabled={!isFormValid}
            >
              Add Domain
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
