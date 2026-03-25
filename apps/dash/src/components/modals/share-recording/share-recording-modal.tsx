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
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { type KeyboardEvent, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import validator from 'validator';
import { z } from 'zod';

import { useGenerateShareToken, useShareRecording, useWorkspaceMembers } from '@/features';
import { useSubscriptionStatus } from '@/features/billing';
import { type ShareMode, shareModeParser } from '@/lib/parsers';
import {
  showCopiedToClipboardToast,
  showCopyFailedToast,
  showDuplicateEmailErrorToast,
  showMaxSendErrorToast,
  showNoEmailsErrorToast,
} from '@/lib/toasts';
import { useWorkspaceId } from '@/stores/workspace';

import { ChooseModeView } from './views/choose-mode-view';
import { ShareLinkView } from './views/share-link-view';

const shareFormSchema = z.object({
  emails: EmailTagsFieldSchema,
});

type ShareFormData = z.infer<typeof shareFormSchema>;

interface ShareRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
}

const DEFAULT_DURATION =
  SHARE_DURATION_OPTIONS.find((o) => o.seconds === SHARE_DEFAULT_DURATION_SECONDS) ??
  SHARE_DURATION_OPTIONS[3]!;

export function ShareRecordingModal({ open, onOpenChange, recordingId }: ShareRecordingModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [showEmailShare, setShowEmailShare] = useState(false);
  const [shareMode, setShareMode] = useQueryState('share_mode', shareModeParser);
  const [shareLink, setShareLink] = useState('');
  const [selectedMode, setSelectedMode] = useState<'internal' | 'external'>('internal');
  const [selectedDuration, setSelectedDuration] =
    useState<(typeof SHARE_DURATION_OPTIONS)[number]>(DEFAULT_DURATION);
  const workspaceId = useWorkspaceId();

  const currentMode: ShareMode = shareMode ?? 'choose';

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

  const activeLink = currentMode === 'external' ? shareLink : internalLink;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activeLink);
      showCopiedToClipboardToast('Recording link');
    } catch {
      showCopyFailedToast();
    }
  };

  const handleShare = () => {
    if (selectedMode === 'internal') {
      setShareMode('internal');
      setShareLink('');
    } else {
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
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setShareMode(null);
      setShareLink('');
      setShowEmailShare(false);
      setEmailInput('');
      setSelectedMode('internal');
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

  const existingEmails = fields.map((f) => f.email.toLowerCase());
  const availableMembers = members.filter(
    (m) => m.memberEmail && !existingEmails.includes(m.memberEmail.toLowerCase())
  );

  const description =
    currentMode === 'choose'
      ? 'Choose how to share this recording'
      : currentMode === 'external'
        ? 'Share with anyone using a temporary link'
        : canSendEmails
          ? 'Share this recording via link or email'
          : 'Share this recording via link';

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
                  {description}
                </DialogDescription>
              </div>
            </div>

            {currentMode === 'choose' && (
              <ChooseModeView selectedMode={selectedMode} onSelectMode={setSelectedMode} />
            )}

            {(currentMode === 'internal' || currentMode === 'external') && (
              <ShareLinkView
                linkLabel={currentMode === 'external' ? 'Public share link' : 'Recording link'}
                activeLink={activeLink}
                onCopyLink={handleCopyLink}
                canSendEmails={canSendEmails}
                showEmailShare={showEmailShare}
                fields={fields}
                remove={remove}
                errors={errors}
                emailInput={emailInput}
                setEmailInput={setEmailInput}
                handleKeyDown={handleKeyDown}
                handleSelectSuggestion={handleSelectSuggestion}
                availableMembers={availableMembers}
                isLoadingMembers={isLoadingMembers}
              />
            )}
          </div>

          <DialogFooter className="mt-6 flex-col! sm:flex-row! sm:items-center gap-3 sm:gap-2">
            {currentMode === 'choose' && selectedMode === 'external' && (
              <div className="flex items-center gap-2 sm:mr-auto">
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
            )}
            {canSendEmails && (currentMode === 'internal' || currentMode === 'external') && (
              <button
                type="button"
                onClick={() => setShowEmailShare(!showEmailShare)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors sm:mr-auto"
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
            <div className="flex gap-2 sm:ml-auto">
              {currentMode === 'choose' ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-6"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="px-6"
                    disabled={isGenerating}
                    onClick={handleShare}
                  >
                    Share
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-6"
                    onClick={handleCopyLink}
                  >
                    Copy
                  </Button>
                  {canSendEmails && showEmailShare && (
                    <Button type="submit" className="px-6" disabled={isPending || !isValid}>
                      {isPending ? 'Sending...' : 'Send'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
