'use client';

import { useState, KeyboardEvent } from 'react';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
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
import { Link, X, HelpCircle } from 'lucide-react';
import { toast } from '@workspace/ui/components/sonner';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { useWorkspaceInvite, useSendWorkspaceInvites } from '@/hooks/use-workspace-invite';

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteModal({ open, onOpenChange }: InviteModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const MAX_EMAILS = 10;

  const { data: inviteResult, isLoading: isLoadingInvite } = useWorkspaceInvite();
  const { mutate: sendInvites, isPending } = useSendWorkspaceInvites();

  const inviteToken = inviteResult?.success ? inviteResult.data : null;
  const inviteLink = inviteToken?.inviteUrl || 'Loading invite link...';

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
      return;
    }
    if (emails.length > 0) {
      sendInvites(emails, {
        onSuccess: () => {
          setEmails([]);
          setEmailInput('');
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <form onSubmit={handleSendInvites}>
          <div className="space-y-6 py-4">
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Invite teammates</DialogTitle>
                <div className="flex items-center gap-1.5">
                  <DialogDescription className="text-sm text-muted-foreground">
                    Send the invite link or email invitations to your team
                  </DialogDescription>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href="https://userplane.com/docs/team-invites"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center"
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Learn more about team invites</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
                  disabled={isLoadingInvite}
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
              <Button
                type="submit"
                className="rounded-full px-6"
                disabled={isPending || emails.length === 0}
              >
                {isPending ? 'Sending...' : 'Send Invites'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
