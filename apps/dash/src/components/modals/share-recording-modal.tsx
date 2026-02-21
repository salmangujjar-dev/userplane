'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { deduplicateEmail, EmailTagsFieldSchema, MAX_EMAIL_RECIPIENTS } from '@workspace/contract';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { AlertCircle, Link, X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import validator from 'validator';
import { z } from 'zod';

import { AVATAR_SIZES, BoringAvatar } from '@/components/shared/boring-avatar';
import { useShareRecording, useWorkspaceMembers } from '@/features';
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
  const workspaceId = useWorkspaceId();

  const { mutate: shareRecording, isPending } = useShareRecording(workspaceId);
  const { data: membersResult, isLoading: isLoadingMembers } = useWorkspaceMembers({
    perPage: 10,
    enabled: open,
  });

  const members = membersResult?.success ? membersResult.data.workspaceMembers : [];

  const recordingLink = `${window.location.origin}/workspace/${workspaceId}/recordings/${recordingId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(recordingLink);
      showCopiedToClipboardToast('Recording link');
    } catch {
      showCopyFailedToast();
    }
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
            onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Share recording</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Share this recording via link or email
                </DialogDescription>
              </div>
            </div>

            {/* Recording Link */}
            <div className="space-y-2">
              <label htmlFor="recording-link" className="text-sm font-medium">
                Recording link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-muted px-4 py-2.5">
                  <input
                    id="recording-link"
                    type="text"
                    value={recordingLink}
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

            {/* Email Input Area */}
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
                    placeholder={fields.length === 0 ? 'Type email and press space or enter' : ''}
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
                <span className="text-xs text-muted-foreground block mb-2">Workspace members:</span>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-7 w-28 rounded-full" />
                  ))}
                </div>
              </div>
            ) : availableMembers.length > 0 ? (
              <div>
                <span className="text-xs text-muted-foreground block mb-2">Workspace members:</span>
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
                {isPending ? 'Sharing...' : 'Share'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
