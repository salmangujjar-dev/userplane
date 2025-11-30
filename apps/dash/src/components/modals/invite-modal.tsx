'use client';

import { useState, KeyboardEvent, useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Link, X } from 'lucide-react';
import { toast } from '@workspace/ui/components/sonner';
import Avatar from 'boring-avatars';
import { useWorkspaceStore } from '@/stores/workspace';

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteModal({ open, onOpenChange }: InviteModalProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const MAX_EMAILS = 10;

  // Generate workspace-specific invite link
  // TODO: Replace with actual API call to generate/fetch invite token
  const inviteLink = useMemo(() => {
    if (!workspaceId) return 'https://userplane.com/workspace/invite/loading';
    // In production, you'd fetch the actual invite token from your API
    // Example: const token = await generateInviteToken(workspaceId);
    return `${window.location.origin}/workspace/invite/accept?workspace=${workspaceId}&token=invite-${workspaceId}`;
  }, [workspaceId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();
    if (emails.length >= MAX_EMAILS) {
      toast.error(`You can only invite up to ${MAX_EMAILS} people at once`);
      return;
    }
    if (trimmedEmail && !emails.includes(trimmedEmail)) {
      setEmails([...emails, trimmedEmail]);
      setEmailInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(emailInput);
    } else if (e.key === 'Backspace' && !emailInput && emails.length > 0) {
      setEmails(emails.slice(0, -1));
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const handleSendInvites = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      addEmail(emailInput);
    }
    if (emails.length > 0) {
      // TODO: Replace with actual API call to send invites
      // Example: await sendWorkspaceInvites(workspaceId, emails);
      console.log('Sending invites for workspace:', workspaceId, 'to:', emails);
      toast.success(`Invites sent to ${emails.length} email${emails.length > 1 ? 's' : ''}`);
      setEmails([]);
      setEmailInput('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <form onSubmit={handleSendInvites}>
          <div className="space-y-4">
            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold">Invite teammates</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Send the invite link or email invitations to your team
              </DialogDescription>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Invite link</label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-muted px-4 py-2.5">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full px-4 py-2.5 h-auto"
                  onClick={handleCopyLink}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="emails" className="text-sm font-medium">
                Email addresses
              </label>
              <div className="w-full rounded-lg bg-muted px-3 py-2 min-h-[100px] focus-within:ring-2 focus-within:ring-ring">
                <div className="flex flex-wrap gap-2">
                  {emails.map((email) => (
                    <div
                      key={email}
                      className="inline-flex items-center gap-2 bg-background rounded-md px-2 py-1 text-sm"
                    >
                      <Avatar
                        size={20}
                        name={email}
                        variant="beam"
                        colors={['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']}
                      />
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="hover:bg-muted rounded-sm p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <input
                    id="emails"
                    type="text"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={emails.length === 0 ? 'Type email and press space or enter' : ''}
                    className="flex-1 min-w-[200px] bg-transparent text-sm focus:outline-none py-1"
                    disabled={emails.length >= MAX_EMAILS}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Press space, enter, or comma after each email ({emails.length}/{MAX_EMAILS})
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-6">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-full px-6">
              Send Invites
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
