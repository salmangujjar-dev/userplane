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
import { BoringAvatar } from '@/components/shared/boring-avatar';
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
          <div className="space-y-6 py-4">
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
                <DialogTitle className="text-xl font-semibold">Invite teammates</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Send the invite link or email invitations to your team
                </DialogDescription>
              </div>
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
                      <BoringAvatar size={20} name={email} />
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
          <DialogFooter className="mt-6">
            <div className="flex gap-2 ml-auto">
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
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
