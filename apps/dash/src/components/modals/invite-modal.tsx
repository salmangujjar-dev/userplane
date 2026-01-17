'use client';

import { useState, KeyboardEvent } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import validator from 'validator';
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
import { Link, X, HelpCircle, AlertCircle } from 'lucide-react';
import { toast } from '@workspace/ui/components/sonner';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { useWorkspaceInvite, useSendWorkspaceInvites } from '@/hooks/use-workspace-invite';

const inviteFormSchema = z.object({
  emails: z
    .array(
      z.object({
        email: z.string(),
        isValid: z.boolean(),
      })
    )
    .refine((emails) => emails.length > 0, {
      message: 'At least one email is required',
    })
    .refine((emails) => emails.some((e) => e.isValid), {
      message: 'At least one valid email is required',
    }),
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmailTagProps {
  email: string;
  isValid: boolean;
  onRemove: () => void;
}

function EmailTag({ email, isValid, onRemove }: EmailTagProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
        isValid ? 'bg-background' : 'bg-destructive/10 border border-destructive'
      }`}
    >
      {isValid ? (
        <BoringAvatar size={20} name={email} />
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

interface EmailInputAreaProps {
  fields: Array<{ id: string; email: string; isValid: boolean }>;
  emailInput: string;
  maxEmails: number;
  hasError: boolean;
  errorMessage?: string;
  onEmailInputChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onRemoveEmail: (index: number) => void;
}

function EmailInputArea({
  fields,
  emailInput,
  maxEmails,
  hasError,
  errorMessage,
  onEmailInputChange,
  onKeyDown,
  onRemoveEmail,
}: EmailInputAreaProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="emails" className="text-sm font-medium">
        Email addresses
      </label>
      <div
        className={`w-full rounded-lg bg-muted px-3 py-2 min-h-[100px] focus-within:ring-2 focus-within:ring-ring ${
          hasError ? 'border border-destructive' : ''
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {fields.map((field, index) => (
            <EmailTag
              key={field.id}
              email={field.email}
              isValid={field.isValid}
              onRemove={() => onRemoveEmail(index)}
            />
          ))}
          <input
            id="emails"
            type="text"
            value={emailInput}
            onChange={(e) => onEmailInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={fields.length === 0 ? 'Type email and press space or enter' : ''}
            className="flex-1 min-w-[200px] bg-transparent text-sm focus:outline-none py-1"
            disabled={fields.length >= maxEmails}
          />
        </div>
      </div>
      <div className="h-4 flex items-center justify-between">
        <div>{errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}</div>
        <p className="text-xs text-muted-foreground">
          {fields.length}/{maxEmails}
        </p>
      </div>
    </div>
  );
}

interface InviteLinkSectionProps {
  inviteLink: string;
  isLoading: boolean;
  onCopyLink: () => void;
}

function InviteLinkSection({ inviteLink, isLoading, onCopyLink }: InviteLinkSectionProps) {
  return (
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
          onClick={onCopyLink}
          disabled={isLoading}
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function InviteModal({ open, onOpenChange }: InviteModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const MAX_EMAILS = 10;

  const { data: inviteResult, isLoading: isLoadingInvite } = useWorkspaceInvite();
  const { mutate: sendInvites, isPending } = useSendWorkspaceInvites();

  const inviteToken = inviteResult?.success ? inviteResult.data : null;
  const inviteLink = inviteToken?.inviteUrl || 'Loading invite link...';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    mode: 'onChange',
    defaultValues: {
      emails: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails',
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const validateEmail = (email: string): boolean => {
    return validator.isEmail(email);
  };

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (fields.length >= MAX_EMAILS) {
      toast.error(`You can only invite up to ${MAX_EMAILS} people at once`);
      return;
    }

    if (!trimmedEmail) return;

    // Check if email already exists
    const emailExists = fields.some((field) => field.email.toLowerCase() === trimmedEmail);
    if (emailExists) {
      toast.error('This email has already been added');
      return;
    }

    const isValid = validateEmail(trimmedEmail);
    append({ email: trimmedEmail, isValid });
    setEmailInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(emailInput);
    } else if (e.key === 'Backspace' && !emailInput && fields.length > 0) {
      remove(fields.length - 1);
    }
  };

  const removeEmail = (index: number) => {
    remove(index);
  };

  const onSubmit = (data: InviteFormData) => {
    // Add current input if exists
    if (emailInput.trim()) {
      addEmail(emailInput);
      return;
    }

    // Only send valid emails
    const validEmails = data.emails.filter((e) => e.isValid).map((e) => e.email);

    if (validEmails.length === 0) {
      toast.error('Please add at least one valid email address');
      return;
    }

    sendInvites(validEmails, {
      onSuccess: () => {
        reset();
        setEmailInput('');
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Invite teammates</DialogTitle>
                <div className="flex items-center gap-2">
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

            {/* Invite Link Section */}
            <InviteLinkSection
              inviteLink={inviteLink}
              isLoading={isLoadingInvite}
              onCopyLink={handleCopyLink}
            />

            {/* Email Input Area */}
            <EmailInputArea
              fields={fields}
              emailInput={emailInput}
              maxEmails={MAX_EMAILS}
              hasError={!!errors.emails}
              errorMessage={errors.emails?.message}
              onEmailInputChange={setEmailInput}
              onKeyDown={handleKeyDown}
              onRemoveEmail={removeEmail}
            />
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
              <Button type="submit" className="rounded-full px-6" disabled={isPending || !isValid}>
                {isPending ? 'Sending...' : 'Send Invites'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
