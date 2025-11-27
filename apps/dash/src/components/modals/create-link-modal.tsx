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
import { Plus } from 'lucide-react';

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
        <Button variant="default" size="default" className="rounded-full">
          Create Link
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold">Create a Link</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add a reference could be a link, ticket, issue or any customer reference
              </DialogDescription>
            </div>
            <input
              id="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. https://github.com/issue/123, JIRA-456, Bug fix for login"
              className="w-full rounded-lg bg-muted px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <DialogFooter className="gap-2 mt-6">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-full px-6">
              Create Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
