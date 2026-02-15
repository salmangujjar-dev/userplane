'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { toast } from '@workspace/ui/components/sonner';
import { Check, ChevronDown, ChevronUp, Copy, LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { URLInput } from '@/components/url-input';
import { ADMIN_NOTIFY_DURATION_OPTIONS, ADMIN_NOTIFY_DURATION_VALUES } from '@/constants/admin';
import { DomainUrlSchema, EmailSchema } from '@/schemas';
import type { AdminNotifyDuration } from '@/types';
import type { AdminCreateWorkspaceInviteData } from '@/types';

interface AdminCreateWorkspaceInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { workspaceUrl: string; notify?: AdminNotifyDuration; email?: string }) => void;
  isPending: boolean;
}

interface AdminCreateWorkspaceInviteSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: AdminCreateWorkspaceInviteData | null;
}

const createWorkspaceInviteFormSchema = z
  .object({
    workspaceUrl: DomainUrlSchema,
    notify: z.enum(ADMIN_NOTIFY_DURATION_VALUES),
    email: EmailSchema.optional(),
  })
  .refine(
    (data) => {
      // Email is required when notify is not 'never'
      if (data.notify !== 'never' && !data.email) {
        return false;
      }
      return true;
    },
    {
      message: 'Email is required when scheduling notifications',
      path: ['email'],
    }
  );

type CreateWorkspaceInviteFormData = z.infer<typeof createWorkspaceInviteFormSchema>;

/**
 * Modal for creating a workspace invite URL.
 * Allows admin to specify workspace URL. Workspaces start on free plan.
 */
export function AdminCreateWorkspaceInviteModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AdminCreateWorkspaceInviteModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateWorkspaceInviteFormData>({
    resolver: zodResolver(createWorkspaceInviteFormSchema),
    mode: 'onTouched',
    defaultValues: {
      workspaceUrl: '',
      notify: 'never',
      email: '',
    },
  });

  // Watch notify field to conditionally show email field
  const notifyValue = watch('notify');

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setShowAdvanced(false);
    }
  }, [open, reset]);

  // Clear email field when notify is set to 'never'
  useEffect(() => {
    if (notifyValue === 'never') {
      setValue('email', '');
    }
  }, [notifyValue, setValue]);

  const onFormSubmit = (data: CreateWorkspaceInviteFormData) => {
    onSubmit({
      workspaceUrl: data.workspaceUrl,
      notify: data.notify,
      email: data.email,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Create Workspace Invite</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Generate an invite URL for workspace creation. Workspaces start on free plan.
                </DialogDescription>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-5">
              <div className="space-y-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="workspace-url" className="text-sm font-medium">
                    Domain URL
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    The domain URL that will be associated with the workspace
                  </p>
                </div>
                <Controller
                  name="workspaceUrl"
                  control={control}
                  render={({ field }) => (
                    <URLInput
                      id="workspace-url"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="example.com"
                      error={!!errors.workspaceUrl}
                      disabled={isPending}
                    />
                  )}
                />
                {errors.workspaceUrl && (
                  <p className="text-sm text-destructive">{errors.workspaceUrl.message}</p>
                )}
              </div>

              {showAdvanced && (
                <div className="space-y-5 pt-5 border-t">
                  <div className="space-y-2.5">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify" className="text-sm font-medium">
                        Notify
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Schedule when to send the invite email
                      </p>
                    </div>
                    <Controller
                      name="notify"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isPending}
                        >
                          <SelectTrigger id="notify" className="rounded-lg">
                            <SelectValue placeholder="Select notification time" />
                          </SelectTrigger>
                          <SelectContent>
                            {ADMIN_NOTIFY_DURATION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {notifyValue !== 'never' && (
                    <div className="space-y-2.5">
                      <div className="space-y-0.5">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Recipient email for scheduled invite
                        </p>
                      </div>
                      <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="email"
                            type="email"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="user@example.com"
                            disabled={isPending}
                            className="rounded-lg"
                          />
                        )}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="mt-8">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
                disabled={isPending}
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Advanced Options
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show Advanced Options
                  </>
                )}
              </button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  className="rounded-full px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || isPending}
                  className="rounded-full px-6"
                >
                  {isPending ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Generate Invite
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Success modal displaying the generated workspace invite URL
 */
export function AdminCreateWorkspaceInviteSuccessModal({
  open,
  onOpenChange,
  result,
}: AdminCreateWorkspaceInviteSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset advanced view when modal closes
  useEffect(() => {
    if (!open) {
      setShowAdvanced(false);
    }
  }, [open]);

  const handleCopy = async () => {
    if (!result?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard', { id: 'clipboard-copy' });
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">
                Invite Created Successfully
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Share this invite URL to provision the workspace
              </DialogDescription>
            </div>
          </div>

          {/* Invite URL */}
          <div className="space-y-4">
            <div className="space-y-2.5">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Invite URL</Label>
                <p className="text-xs text-muted-foreground">
                  Share this URL to provision the workspace
                </p>
              </div>
              <input
                type="text"
                value={result.inviteUrl}
                readOnly
                className="w-full rounded-lg border bg-muted px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">The invite token is valid for 7 days</p>
            </div>

            {showAdvanced && (
              <div className="space-y-3 pt-5 border-t">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Workspace ID</p>
                  <p className="text-sm font-mono break-all">{result.workspaceId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Domain URL</p>
                  <p className="text-sm break-all">{result.workspaceUrl}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="mt-8">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show Details
                </>
              )}
            </button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="rounded-full px-6"
              >
                Done
              </Button>
              <Button onClick={handleCopy} className="rounded-full px-6 w-[140px]">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
