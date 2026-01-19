'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FormEmailSchema } from '@workspace/contract';
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
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const billingEmailFormSchema = z.object({
  email: FormEmailSchema,
});

interface BillingEmailVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  onRequestChange: (email: string) => Promise<void>;
  isLoading?: boolean;
}

export function BillingEmailVerificationModal({
  open,
  onOpenChange,
  currentEmail,
  onRequestChange,
  isLoading = false,
}: BillingEmailVerificationModalProps) {
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(billingEmailFormSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
    },
  });

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setEmailSent(false);
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: { email: string }) => {
    await onRequestChange(data.email);
    setEmailSent(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={true}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Update Billing Email</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {emailSent ? 'Verification email sent' : 'Enter the new billing email address'}
              </DialogDescription>
            </div>
          </div>

          {emailSent ? (
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">Verification Email Sent</p>
                    <p className="text-xs text-muted-foreground">
                      Check your inbox for a verification link. Click the link to complete the
                      billing email update.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">Link Expires in 10 Minutes</p>
                    <p className="text-xs text-muted-foreground">
                      The verification link will expire after 10 minutes for security reasons.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">Notification to Owners</p>
                    <p className="text-xs text-muted-foreground">
                      Workspace owners will be notified once the change is complete.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-email">Current Billing Email</Label>
                <Input
                  id="current-email"
                  type="email"
                  value={currentEmail || 'Not set'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">New Billing Email</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="new-email"
                      type="email"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Enter new billing email"
                      disabled={isLoading}
                    />
                  )}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </form>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              {emailSent ? 'Done' : 'Cancel'}
            </Button>
            {!emailSent && (
              <Button
                type="button"
                className="rounded-full px-6"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading || !isValid}
              >
                {isLoading ? 'Sending...' : 'Send Verification Email'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
