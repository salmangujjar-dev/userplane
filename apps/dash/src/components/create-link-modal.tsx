'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';

interface CreateLinkModalProps {
  onLinkCreated: (link: string) => void;
}

export function CreateLinkModal({ onLinkCreated }: CreateLinkModalProps) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedLink = `https://userplane.com/r/${Math.random().toString(36).substring(7)}`;
    onLinkCreated(generatedLink);
    setOpen(false);
    setReference('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="default" className="rounded-lg">
          Create Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <form onSubmit={handleSubmit}>
          <div className="py-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <DialogTitle className="text-base font-semibold">Reference</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Could be a link, a ticket number, issue or any reference name
                </DialogDescription>
              </div>
              <input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. https://github.com/issue/123, JIRA-456, Bug fix for login"
                className="w-full rounded-2xl bg-muted px-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl px-6"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl px-6">
              Create Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
