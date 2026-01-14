'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Label } from '@workspace/ui/components/label';
import { URLInput } from '@/components/url-input';

interface AddEmailDomainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (domain: string) => void;
  existingDomains: string[];
}

export function AddEmailDomainModal({
  open,
  onOpenChange,
  onAdd,
  existingDomains,
}: AddEmailDomainModalProps) {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDomain('');
      setError(null);
    }
  }, [open]);

  const extractDomain = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      return null;
    }
  };

  const validateDomain = (url: string): string | null => {
    const domainOnly = extractDomain(url);
    if (!domainOnly) {
      return 'Please enter a valid URL';
    }
    if (existingDomains.includes(domainOnly)) {
      return 'This domain has already been added';
    }
    return null;
  };

  const handleAdd = () => {
    const validationError = validateDomain(domain);
    if (validationError) {
      setError(validationError);
      return;
    }
    const domainOnly = extractDomain(domain);
    if (domainOnly) {
      onAdd(domainOnly);
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Add Email Domain</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add a domain to allow users with matching email addresses
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-domain">Email Domain</Label>
              <URLInput
                id="email-domain"
                value={domain}
                onChange={(value) => {
                  setDomain(value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="example.com"
                error={!!error}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-6"
          >
            Cancel
          </Button>
          <Button onClick={handleAdd} className="rounded-full px-6" disabled={!domain}>
            Add Domain
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
