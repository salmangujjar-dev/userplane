'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: 'domain' | 'project' | 'recording' | 'link';
  onConfirm: () => void;
  isLoading?: boolean;
  description?: string;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  itemName,
  itemType,
  onConfirm,
  isLoading = false,
  description,
}: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (confirmText === itemName) {
      onConfirm();
    }
  };

  const isConfirmDisabled = confirmText !== itemName || isLoading;

  const getItemTypeDisplay = () => {
    return itemType.charAt(0).toUpperCase() + itemType.slice(1);
  };

  const getDefaultDescription = () => {
    switch (itemType) {
      case 'domain':
        return 'This will permanently delete the domain and all associated recordings and links.';
      case 'project':
        return 'This will permanently delete the project and all associated recordings and links.';
      case 'recording':
        return 'This will permanently delete the recording. This action cannot be undone.';
      case 'link':
        return 'This will permanently delete the link. Existing recordings will remain.';
      default:
        return 'This action cannot be undone.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>Delete {getItemTypeDisplay()}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            {description || getDefaultDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div>
            <Label htmlFor="confirm-name" className="mb-3 block">
              Type <strong>{itemName}</strong> to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={itemName}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isLoading ? 'Deleting...' : `Delete ${getItemTypeDisplay()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
