'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  deduplicateEmail,
  EmailTagsFieldSchema,
  MAX_EMAIL_RECIPIENTS,
  SHARE_DEFAULT_DURATION_SECONDS,
  SHARE_DURATION_OPTIONS,
} from '@userplane/contract';
import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import Logo from '@userplane/ui/components/logo';
import { Skeleton } from '@userplane/ui/components/skeleton';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link,
  Loader2,
  Users,
  X,
} from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import validator from 'validator';
import { z } from 'zod';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { useGenerateShareToken, useShareRecording, useWorkspaceMembers } from '@/features';
import { useSubscriptionStatus } from '@/features/billing';
import {
  showCopiedToClipboardToast,
  showCopyFailedToast,
  showDuplicateEmailErrorToast,
  showMaxSendErrorToast,
  showNoEmailsErrorToast,
} from '@/lib/toasts';
import { useWorkspaceId } from '@/stores/workspace';

const shareFormSchema = z.object({
  emails: EmailTagsFieldSchema,
});

type ShareFormData = z.infer<typeof shareFormSchema>;

type ShareMode = 'choose' | 'internal' | 'external';

interface ShareRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
}

interface EmailTagProps {
  email: string;
  isValid: boolean;
  name?: string;
  onRemove: () => void;
}

const DEFAULT_DURATION =
  SHARE_DURATION_OPTIONS.find((o) => o.seconds === SHARE_DEFAULT_DURATION_SECONDS) ??
  SHARE_DURATION_OPTIONS[3]!;

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

export function ShareRecordingModal({ open, onOpenChange, recordingId }: ShareRecordingModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [showEmailShare, setShowEmailShare] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>('choose');
  const [shareLink, setShareLink] = useState('');
  const [selectedDuration, setSelectedDuration] =
    useState<(typeof SHARE_DURATION_OPTIONS)[number]>(DEFAULT_DURATION);
  const workspaceId = useWorkspaceId();

  const { data: subscriptionResult } = useSubscriptionStatus();
  const canSendEmails =
    subscriptionResult?.success && subscriptionResult.data.featureGates?.sendOutboundEmails;

  const { mutate: shareRecording, isPending } = useShareRecording(workspaceId);
  const { mutate: generateShareToken, isPending: isGenerating } =
    useGenerateShareToken(workspaceId);
  const { data: membersResult, isLoading: isLoadingMembers } = useWorkspaceMembers({
    perPage: 10,
    enabled: open,
  });

  const members = membersResult?.success ? membersResult.data.workspaceMembers : [];

  const internalLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/workspace/${workspaceId}/recordings/${recordingId}`
      : '';

  const activeLink = shareMode === 'external' ? shareLink : internalLink;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activeLink);
      showCopiedToClipboardToast('Recording link');
    } catch {
      showCopyFailedToast();
    }
  };

  const handleSelectInternal = () => {
    setShareMode('internal');
    setShareLink('');
  };

  const handleSelectExternal = () => {
    generateShareToken(
      { recordingId, expiresInSeconds: selectedDuration.seconds },
      {
        onSuccess: (result) => {
          if (result.success) {
            setShareLink(result.data.shareUrl);
            setShareMode('external');
          }
        },
      }
    );
  };

  const handleBack = () => {
    setShareMode('choose');
    setShareLink('');
    setShowEmailShare(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setShareMode('choose');
      setShareLink('');
      setShowEmailShare(false);
      setEmailInput('');
      reset();
    }
    onOpenChange(isOpen);
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ShareFormData>({
    resolver: zodResolver(shareFormSchema),
    mode: 'onChange',
    defaultValues: {
      emails: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails',
  });

  const validateEmail = (email: string): boolean => {
    return validator.isEmail(email);
  };

  const addEmail = (email: string, name?: string) => {
    if (fields.length >= MAX_EMAIL_RECIPIENTS) {
      showMaxSendErrorToast(MAX_EMAIL_RECIPIENTS);
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

  const handleSelectSuggestion = (email: string, name?: string) => {
    addEmail(email, name);
  };

  const onSubmit = (data: ShareFormData) => {
    if (emailInput.trim()) {
      addEmail(emailInput);
      return;
    }

    const validEmails = data.emails.filter((e) => e.isValid).map((e) => e.email);

    if (validEmails.length === 0) {
      showNoEmailsErrorToast();
      return;
    }

    shareRecording(
      { recordingId, emails: validEmails },
      {
        onSuccess: (result) => {
          if (result.success) {
            reset();
            setEmailInput('');
            handleOpenChange(false);
          }
        },
      }
    );
  };

  // Filter suggestions: exclude already-added emails
  const existingEmails = fields.map((f) => f.email.toLowerCase());
  const availableMembers = members.filter(
    (m) => m.memberEmail && !existingEmails.includes(m.memberEmail.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Share recording</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {shareMode === 'choose'
                    ? 'Choose how to share this recording'
                    : shareMode === 'external'
                      ? 'Share with anyone using a temporary link'
                      : canSendEmails
                        ? 'Share this recording via link or email'
                        : 'Share this recording via link'}
                </DialogDescription>
              </div>
            </div>

            {/* Choose Mode Step */}
            {shareMode === 'choose' && (
              <div className="grid grid-cols-2 gap-3">
                {/* Internal sharing card */}
                <button
                  type="button"
                  onClick={handleSelectInternal}
                  className="group rounded-xl overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all text-left"
                >
                  <div className="h-32 bg-linear-to-br from-emerald-200 via-lime-200 to-yellow-200 p-3">
                    <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-emerald-200 flex items-center justify-center">
                            <Users className="w-2.5 h-2.5 text-emerald-600" />
                          </div>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-lime-200 flex items-center justify-center">
                            <Users className="w-2.5 h-2.5 text-lime-600" />
                          </div>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded w-3/4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-yellow-200 flex items-center justify-center">
                            <Users className="w-2.5 h-2.5 text-yellow-600" />
                          </div>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm">Share with teammates</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recipients need a Userplane account
                    </p>
                  </div>
                </button>

                {/* External sharing card */}
                <div className="rounded-xl overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all text-left">
                  <button
                    type="button"
                    onClick={handleSelectExternal}
                    disabled={isGenerating}
                    className="w-full text-left relative"
                  >
                    {isGenerating && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-t-xl">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                    <div className="h-32 bg-linear-to-br from-blue-200 via-indigo-200 to-violet-200 p-3">
                      <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-200 flex items-center justify-center">
                              <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                            </div>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-indigo-200 flex items-center justify-center">
                              <ExternalLink className="w-2.5 h-2.5 text-indigo-600" />
                            </div>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded w-3/4" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-violet-200 flex items-center justify-center">
                              <ExternalLink className="w-2.5 h-2.5 text-violet-600" />
                            </div>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 pb-0">
                      <p className="font-medium text-sm">Share externally</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Generate a temporary link — no account needed
                      </p>
                    </div>
                  </button>
                  <div className="px-3 pb-3 pt-2 flex items-center gap-2">
                    <label
                      htmlFor="duration-select"
                      className="text-xs text-muted-foreground whitespace-nowrap"
                    >
                      Expires in:
                    </label>
                    <select
                      id="duration-select"
                      value={selectedDuration.seconds}
                      onChange={(e) => {
                        const option = SHARE_DURATION_OPTIONS.find(
                          (o) => o.seconds === Number(e.target.value)
                        );
                        if (option) setSelectedDuration(option);
                      }}
                      className="text-xs rounded-md border bg-background px-2 py-1"
                    >
                      {SHARE_DURATION_OPTIONS.map((option) => (
                        <option key={option.seconds} value={option.seconds}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Link + Email Step (for both internal and external modes) */}
            {(shareMode === 'internal' || shareMode === 'external') && (
              <>
                {/* Recording Link */}
                <div className="space-y-2">
                  <label htmlFor="recording-link" className="text-sm font-medium">
                    {shareMode === 'external' ? 'Public share link' : 'Recording link'}
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg bg-muted px-4 py-2.5">
                      <input
                        id="recording-link"
                        type="text"
                        value={activeLink}
                        readOnly
                        className="w-full bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-4 py-2.5 h-auto"
                      onClick={handleCopyLink}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Email Share Section (gated by sendOutboundEmails, only for internal mode) */}
                {canSendEmails && shareMode === 'internal' && showEmailShare && (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="share-emails" className="text-sm font-medium">
                        Email addresses
                      </label>
                      <div
                        className={`w-full rounded-lg bg-muted px-3 py-2 min-h-[100px] focus-within:ring-2 focus-within:ring-ring ${
                          errors.emails ? 'border border-destructive' : ''
                        }`}
                      >
                        <div className="flex flex-wrap gap-2">
                          {fields.map((field, index) => (
                            <EmailTag
                              key={field.id}
                              email={field.email}
                              isValid={field.isValid}
                              name={field.name}
                              onRemove={() => remove(index)}
                            />
                          ))}
                          <input
                            id="share-emails"
                            type="text"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                              fields.length === 0 ? 'Type email and press space or enter' : ''
                            }
                            className="flex-1 min-w-[200px] bg-transparent text-sm focus:outline-none py-1"
                            disabled={fields.length >= MAX_EMAIL_RECIPIENTS}
                          />
                        </div>
                      </div>
                      <div className="h-4 flex items-center justify-between">
                        <div>
                          {errors.emails?.message && (
                            <p className="text-xs text-destructive">{errors.emails.message}</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {fields.length}/{MAX_EMAIL_RECIPIENTS}
                        </p>
                      </div>
                    </div>

                    {/* Member Suggestions */}
                    {isLoadingMembers ? (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-2">
                          Workspace members:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: 3 }, (_, i) => (
                            <Skeleton key={i} className="h-7 w-28 rounded-full" />
                          ))}
                        </div>
                      </div>
                    ) : availableMembers.length > 0 ? (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-2">
                          Workspace members:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {availableMembers.map((m) => (
                            <button
                              key={m.workspaceMemberId}
                              type="button"
                              onClick={() => handleSelectSuggestion(m.memberEmail, m.memberName)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <BoringAvatar
                                size={AVATAR_SIZES.COMPACT}
                                name={m.memberName}
                                email={m.memberEmail}
                              />
                              <span className="truncate max-w-[120px]">
                                {m.memberName || m.memberEmail}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter className="mt-6">
            {(shareMode === 'internal' || shareMode === 'external') && (
              <button
                type="button"
                onClick={handleBack}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
              >
                Back
              </button>
            )}
            {canSendEmails && shareMode === 'internal' && (
              <button
                type="button"
                onClick={() => setShowEmailShare(!showEmailShare)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showEmailShare ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Email Sharing
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Share by Email
                  </>
                )}
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="secondary"
                className="px-6"
                onClick={() => handleOpenChange(false)}
              >
                {shareMode === 'choose' ? 'Cancel' : 'Done'}
              </Button>
              {canSendEmails && shareMode === 'internal' && showEmailShare && (
                <Button type="submit" className="px-6" disabled={isPending || !isValid}>
                  {isPending ? 'Sharing...' : 'Share'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
