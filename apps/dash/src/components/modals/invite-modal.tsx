'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { deduplicateEmail, EmailTagsFieldSchema, MAX_EMAIL_RECIPIENTS } from '@userplane/contract';
import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import Logo from '@userplane/ui/components/logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@userplane/ui/components/tooltip';
import { AlertCircle, ChevronDown, ChevronUp, HelpCircle, Link, X } from 'lucide-react';
import { KeyboardEvent, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import validator from 'validator';
import { z } from 'zod';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { SUPPORT_LINKS } from '@/constants';
import { useSubscriptionStatus } from '@/features/billing';
import {
  useIntegrationSuggestions,
  useSendWorkspaceInvites,
  useWorkspaceInvite,
} from '@/features/workspace';
import { usePlanLimitHandler } from '@/hooks/use-plan-limit-handler';
import {
  showCopiedToClipboardToast,
  showCopyFailedToast,
  showDuplicateEmailErrorToast,
  showMaxEmailsErrorToast,
  showNoEmailsErrorToast,
} from '@/lib/toasts';
import { useWorkspaceStore } from '@/stores/workspace';

const inviteFormSchema = z.object({
  emails: EmailTagsFieldSchema,
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmailTagProps {
  email: string;
  isValid: boolean;
  name?: string;
  onRemove: () => void;
}

function EmailTag({ email, isValid, name, onRemove }: EmailTagProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
        isValid ? 'bg-background' : 'bg-destructive/10 border border-destructive'
      }`}
    >
      {isValid ? (
        <BoringAvatar size={AVATAR_SIZES.TAG} name={name} email={email} />
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
  fields: Array<{ id: string; email: string; isValid: boolean; name?: string }>;
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
        className={`w-full rounded-lg bg-muted px-3 py-2 min-h-[72px] sm:min-h-[100px] focus-within:ring-2 focus-within:ring-ring ${
          hasError ? 'border border-destructive' : ''
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {fields.map((field, index) => (
            <EmailTag
              key={field.id}
              email={field.email}
              isValid={field.isValid}
              name={field.name}
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
            className="flex-1 min-w-[120px] sm:min-w-[200px] bg-transparent text-sm focus:outline-none py-1"
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
      <label htmlFor="invite-link" className="text-sm font-medium">
        Invite link
      </label>
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 rounded-lg bg-muted px-4 py-2.5">
          <input
            id="invite-link"
            type="text"
            value={inviteLink}
            readOnly
            className="w-full bg-transparent text-sm focus:outline-none truncate"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="px-4 py-2.5 h-auto"
          onClick={onCopyLink}
          disabled={isLoading}
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface SuggestionsPillsProps {
  suggestions: Array<{ id: string; email: string; name: string | null }>;
  onSelect: (email: string, name?: string) => void;
  existingEmails: string[];
  hasMore: boolean;
  /** Full path to the provider-specific invite page (e.g. /workspace/:id/settings/integrations/slack/invite) */
  invitePath: string | null;
}

function SuggestionsPills({
  suggestions,
  onSelect,
  existingEmails,
  hasMore,
  invitePath,
}: SuggestionsPillsProps) {
  // Filter out emails already added to the input
  const available = suggestions.filter((s) => !existingEmails.includes(s.email.toLowerCase()));

  if (available.length === 0) return null;

  return (
    <div>
      <span className="text-xs text-muted-foreground block mb-2">Suggestions:</span>
      <div className="flex flex-wrap gap-2">
        {available.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.email, s.name ?? undefined)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <BoringAvatar size={AVATAR_SIZES.COMPACT} name={s.name} email={s.email} />
            <span className="truncate max-w-[100px] sm:max-w-[120px]">{s.name || s.email}</span>
          </button>
        ))}
        {hasMore && invitePath && (
          <a
            href={invitePath}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex -space-x-1.5">
              {Array.from({ length: 3 }, (_, i) => `more-avatar-${i}`).map((id) => (
                <BoringAvatar key={id} size={AVATAR_SIZES.COMPACT} />
              ))}
            </div>
            <span>More</span>
          </a>
        )}
      </div>
    </div>
  );
}

export function InviteModal({ open, onOpenChange }: InviteModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [showEmailInvite, setShowEmailInvite] = useState(false);
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const { handlePlanLimit } = usePlanLimitHandler();

  const { data: subscriptionResult } = useSubscriptionStatus();
  const canSendEmails =
    subscriptionResult?.success && subscriptionResult.data.featureGates?.sendOutboundEmails;

  const { data: inviteResult, isLoading: isLoadingInvite } = useWorkspaceInvite();
  const { mutate: sendInvites, isPending } = useSendWorkspaceInvites(workspaceId);
  const {
    suggestions,
    hasMore: hasMoreSuggestions,
    invitePath,
  } = useIntegrationSuggestions(8, open);

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

  // Reset all state when modal closes (Cancel, click-outside, Escape, etc.)
  // Reset when the modal closes (adjust state during render)
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      reset();
      setEmailInput('');
      setShowEmailInvite(false);
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      showCopiedToClipboardToast('Invite link');
    } catch {
      showCopyFailedToast();
    }
  };

  const validateEmail = (email: string): boolean => {
    return validator.isEmail(email);
  };

  const addEmail = (email: string, name?: string) => {
    if (fields.length >= MAX_EMAIL_RECIPIENTS) {
      showMaxEmailsErrorToast(MAX_EMAIL_RECIPIENTS);
      return;
    }

    const trimmedEmail = deduplicateEmail(email, fields);
    if (!trimmedEmail) {
      if (email.trim()) showDuplicateEmailErrorToast();
      return;
    }

    append({ email: trimmedEmail, isValid: validateEmail(trimmedEmail), name });
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

  const handleSelectSuggestion = (email: string, name?: string) => {
    addEmail(email, name);
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
      showNoEmailsErrorToast();
      return;
    }

    sendInvites(validEmails, {
      onSuccess: (result) => {
        if (!result.success && handlePlanLimit(result.error)) {
          onOpenChange(false);
          return;
        }
        if (result.success) {
          reset();
          setEmailInput('');
          onOpenChange(false);
        }
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
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogDescription className="text-sm text-muted-foreground">
                    {canSendEmails
                      ? 'Send the invite link or email invitations to your team'
                      : 'Share the invite link with your team'}
                  </DialogDescription>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={SUPPORT_LINKS.teamInvites}
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

            {/* Email Invite Section (gated by sendOutboundEmails) */}
            {canSendEmails && showEmailInvite && (
              <>
                <EmailInputArea
                  fields={fields}
                  emailInput={emailInput}
                  maxEmails={MAX_EMAIL_RECIPIENTS}
                  hasError={!!errors.emails}
                  errorMessage={errors.emails?.message}
                  onEmailInputChange={setEmailInput}
                  onKeyDown={handleKeyDown}
                  onRemoveEmail={removeEmail}
                />

                {suggestions.length > 0 && (
                  <SuggestionsPills
                    suggestions={suggestions}
                    onSelect={handleSelectSuggestion}
                    existingEmails={fields.map((f) => f.email.toLowerCase())}
                    hasMore={hasMoreSuggestions}
                    invitePath={invitePath}
                  />
                )}
              </>
            )}
          </div>

          <DialogFooter className="mt-6 !flex-col sm:!flex-row sm:items-center gap-3 sm:gap-2">
            {canSendEmails && (
              <button
                type="button"
                onClick={() => setShowEmailInvite(!showEmailInvite)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors sm:mr-auto"
              >
                {showEmailInvite ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Email Invites
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Invite by Email
                  </>
                )}
              </button>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button
                type="button"
                variant="secondary"
                className="px-6"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {canSendEmails && showEmailInvite && (
                <Button type="submit" className="px-6" disabled={isPending || !isValid}>
                  {isPending ? 'Sending...' : 'Send Invites'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
