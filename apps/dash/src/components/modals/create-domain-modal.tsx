'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Label } from '@workspace/ui/components/label';
import { URLInput } from '@/components/url-input';
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
  loading?: boolean;
}

export function CreateDomainModal({
  open,
  onOpenChange,
  onCreateDomain,
  loading = false,
}: CreateDomainModalProps) {
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
            <Logo variant="tiled" size="md" showText={false} />
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
              <URLInput
                id="domain-url"
                value={domainUrl}
                onChange={setDomainUrl}
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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleCreate}
              disabled={!isFormValid || loading}
            >
              {loading ? 'Adding...' : 'Add Domain'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
