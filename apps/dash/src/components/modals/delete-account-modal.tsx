'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import { Input } from '@userplane/ui/components/input';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import { useEffect, useState } from 'react';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
  email,
  onConfirm,
  isLoading = false,
}: DeleteAccountModalProps) {
  const [confirmEmail, setConfirmEmail] = useState('');

  // Reset input when the modal closes
  useEffect(() => {
    if (!open) {
      setConfirmEmail('');
    }
  }, [open]);

  const isConfirmDisabled = confirmEmail !== email || isLoading;

  const handleConfirm = () => {
    if (!isConfirmDisabled) {
      onConfirm();
    }
  };

  const consequences = [
    {
      title: 'Your account will be permanently removed',
      description:
        'When you delete your Userplane account, your access will be permanently removed. This action cannot be undone',
    },
    {
      title: 'What happens to your data',
      description:
        'Your recordings and shared links are kept until your workspace is deleted or according to its data retention policy.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Delete Account</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Permanently delete your Userplane account
              </DialogDescription>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="space-y-2.5">
              {consequences.map((consequence) => (
                <div key={consequence.title} className="flex gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{consequence.title}</p>
                    <p className="text-xs text-muted-foreground">{consequence.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="confirm-email" className="mb-2 block">
              Type <strong>{email}</strong> to confirm
            </Label>
            <Input
              id="confirm-email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={email}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="px-6"
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
            >
              {isLoading ? 'Processing...' : 'Delete Account'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
