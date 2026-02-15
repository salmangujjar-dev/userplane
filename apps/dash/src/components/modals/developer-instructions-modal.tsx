'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { toast } from '@workspace/ui/components/sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { AlertCircle, HelpCircle, X } from 'lucide-react';
import { KeyboardEvent, useState } from 'react';
import validator from 'validator';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { SUPPORT_LINKS } from '@/constants';

interface EmailEntry {
  email: string;
  isValid: boolean;
}

interface DeveloperInstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainUrl: string;
  onSend: (emails: string[]) => void;
  loading?: boolean;
}

function EmailTag({
  email,
  isValid,
  onRemove,
}: {
  email: string;
  isValid: boolean;
  onRemove: () => void;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
        isValid ? 'bg-background' : 'bg-destructive/10 border border-destructive'
      }`}
    >
      {isValid ? (
        <BoringAvatar size={AVATAR_SIZES.TAG} email={email} />
      ) : (
        <AlertCircle className="h-4 w-4 text-destructive" />
      )}
      <span className={isValid ? '' : 'text-destructive'}>{email}</span>
      <button type="button" onClick={onRemove} className="hover:bg-muted rounded-sm p-0.5">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function DeveloperInstructionsModal({
  open,
  onOpenChange,
  domainUrl,
  onSend,
  loading = false,
}: DeveloperInstructionsModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const MAX_EMAILS = 10;

  const validateEmail = (email: string): boolean => validator.isEmail(email);

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (emails.length >= MAX_EMAILS) {
      toast.error(`You can only send to up to ${MAX_EMAILS} people at once`);
      return;
    }

    if (!trimmedEmail) return;

    const exists = emails.some((e) => e.email.toLowerCase() === trimmedEmail);
    if (exists) {
      toast.error('This email has already been added');
      return;
    }

    const isValid = validateEmail(trimmedEmail);
    setEmails((prev) => [...prev, { email: trimmedEmail, isValid }]);
    setEmailInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(emailInput);
    } else if (e.key === 'Backspace' && !emailInput && emails.length > 0) {
      setEmails((prev) => prev.slice(0, -1));
    }
  };

  const removeEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const validEmails = emails.filter((e) => e.isValid).map((e) => e.email);
  const hasError = emails.length > 0 && validEmails.length === 0;

  const handleSendInstructions = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      addEmail(emailInput);
      return;
    }
    if (validEmails.length === 0) {
      toast.error('Please add at least one valid email address');
      return;
    }
    onSend(validEmails);
    setEmails([]);
    setEmailInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <form onSubmit={handleSendInstructions}>
          <div className="space-y-6 py-4">
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">
                  Send developer instructions
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <DialogDescription className="text-sm text-muted-foreground">
                    Send setup instructions for {domainUrl}
                  </DialogDescription>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={SUPPORT_LINKS.domains}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center"
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Learn more about domain setup</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="emails" className="text-sm font-medium">
                Developer email addresses
              </label>
              <div
                className={`w-full rounded-lg bg-muted px-3 py-2 min-h-[100px] focus-within:ring-2 focus-within:ring-ring ${
                  hasError ? 'border border-destructive' : ''
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  {emails.map((entry, index) => (
                    <EmailTag
                      key={`${entry.email}-${index}`}
                      email={entry.email}
                      isValid={entry.isValid}
                      onRemove={() => removeEmail(index)}
                    />
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
              <div className="h-4 flex items-center justify-between">
                <div>
                  {hasError && (
                    <p className="text-xs text-destructive">At least one valid email is required</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {emails.length}/{MAX_EMAILS}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
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
              disabled={loading || validEmails.length === 0}
            >
              {loading ? 'Sending...' : 'Send Instructions'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
