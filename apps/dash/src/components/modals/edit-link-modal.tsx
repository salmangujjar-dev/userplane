'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';

interface EditLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isReusable: boolean;
  onSave: (title: string, isReusable: boolean) => void;
}

export function EditLinkModal({
  open,
  onOpenChange,
  title,
  isReusable,
  onSave,
}: EditLinkModalProps) {
  const [editTitle, setEditTitle] = useState(title);
  const [editIsReusable, setEditIsReusable] = useState(isReusable);

  useEffect(() => {
    if (open) {
      setEditTitle(title);
      setEditIsReusable(isReusable);
    }
  }, [open, title, isReusable]);

  const handleSave = () => {
    onSave(editTitle, editIsReusable);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <svg
                viewBox="0 0 512 512"
                className="h-8 w-8 flex-shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M210.09,0c10.56,0,19.12,8.56,19.12,19.12v63.74c0,10.56-8.56,19.12-19.12,19.12s-19.12-8.56-19.12-19.12V19.12C190.97,8.56,199.53,0,210.09,0z M88.22,50.22c7.47-7.47,19.57-7.47,27.04,0l44.62,44.61c7.47,7.47,7.47,19.57,0,27.04c-7.47,7.47-19.57,7.47-27.04,0L88.22,77.26C80.75,69.8,80.75,57.69,88.22,50.22z M331.97,50.22c7.47,7.47,7.47,19.57,0,27.04l-44.62,44.62c-7.47,7.47-19.57,7.47-27.04,0c-7.47-7.47-7.47-19.57,0-27.04l44.62-44.62C312.39,42.75,324.5,42.75,331.97,50.22z M38,172.09c0-10.56,8.56-19.12,19.12-19.12h63.74c10.56,0,19.12,8.56,19.12,19.12c0,10.56-8.56,19.12-19.12,19.12H57.12C46.56,191.21,38,182.65,38,172.09z M190.97,190.88c0-28.73,33.7-44.23,55.51-25.53l215.71,184.9c23.2,19.89,9.99,57.91-20.54,59.13l-97.9,3.92c-10.52,0.42-20.42,5.09-27.44,12.93l-66.66,74.5c-20.58,23-58.69,8.44-58.69-22.42V190.88z" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <DialogTitle className="text-xl font-semibold">Edit Recording Link</DialogTitle>
              <DialogDescription>
                Update the title and reusability settings for this recording link.
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-title">Link Title</Label>
              <Input
                id="link-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter link title"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reusable">Reusable Link</Label>
                <p className="text-sm text-muted-foreground">
                  Allow multiple recordings with this link
                </p>
              </div>
              <Switch id="reusable" checked={editIsReusable} onCheckedChange={setEditIsReusable} />
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
          <Button onClick={handleSave} className="rounded-full px-6">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
