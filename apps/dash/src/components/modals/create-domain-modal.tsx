'use client';

import { useState, useEffect } from 'react';
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
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <svg
                viewBox="0 0 512 512"
                className="h-8 w-8 shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M210.09,0c10.56,0,19.12,8.56,19.12,19.12v63.74c0,10.56-8.56,19.12-19.12,19.12s-19.12-8.56-19.12-19.12V19.12C190.97,8.56,199.53,0,210.09,0z M88.22,50.22c7.47-7.47,19.57-7.47,27.04,0l44.62,44.61c7.47,7.47,7.47,19.57,0,27.04c-7.47,7.47-19.57,7.47-27.04,0L88.22,77.26C80.75,69.8,80.75,57.69,88.22,50.22z M331.97,50.22c7.47,7.47,7.47,19.57,0,27.04l-44.62,44.62c-7.47,7.47-19.57,7.47-27.04,0c-7.47-7.47-7.47-19.57,0-27.04l44.62-44.62C312.39,42.75,324.5,42.75,331.97,50.22z M38,172.09c0-10.56,8.56-19.12,19.12-19.12h63.74c10.56,0,19.12,8.56,19.12,19.12c0,10.56-8.56,19.12-19.12,19.12H57.12C46.56,191.21,38,182.65,38,172.09z M190.97,190.88c0-28.73,33.7-44.23,55.51-25.53l215.71,184.9c23.2,19.89,9.99,57.91-20.54,59.13l-97.9,3.92c-10.52,0.42-20.42,5.09-27.44,12.93l-66.66,74.5c-20.58,23-58.69,8.44-58.69-22.42V190.88z" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <DialogTitle className="text-xl font-semibold">Add New Domain</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add a new domain for recording sessions
              </DialogDescription>
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
