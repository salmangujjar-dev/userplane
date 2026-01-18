'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AccountNameSchema } from '@workspace/contract';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/ui/lib/utils';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { SectionError } from '@/components/shared/section-error';
import { AccountSettingsSectionSkeleton } from '@/components/skeleton';
import { useAccount } from '@/hooks/use-account';
import { useUpdateAccountName } from '@/queries/use-account-mutations';

const accountNameFormSchema = z.object({
  name: AccountNameSchema,
});

export function AccountSettingsSection() {
  const { data: accountResult, isLoading, error, refetch } = useAccount();

  const accountData = accountResult?.success ? accountResult.data : null;
  const originalName = accountData?.userName || '';
  const email = accountData?.userEmail || '';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm({
    resolver: zodResolver(accountNameFormSchema),
    mode: 'onTouched',
    defaultValues: {
      name: originalName,
    },
  });

  useEffect(() => {
    if (accountData?.userName) {
      reset({ name: accountData.userName });
    }
  }, [accountData, reset]);

  const updateNameMutation = useUpdateAccountName((originalName) => reset({ name: originalName }));

  const onSaveName = (data: { name: string }) => {
    updateNameMutation.mutate(data.name);
  };

  if (isLoading) {
    return <AccountSettingsSectionSkeleton />;
  }

  if (error || (accountResult && !accountResult.success)) {
    return (
      <div className="w-full max-w-2xl">
        <SectionError
          title="Failed to load account"
          description={
            error instanceof Error
              ? error.message
              : accountResult && !accountResult.success
                ? accountResult.error.message
                : 'Something went wrong while loading your account.'
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSaveName)} className="space-y-2">
          <div>
            <Label htmlFor="account-name">Name</Label>
            <p className="text-sm text-muted-foreground mt-1">Your full name</p>
          </div>
          <div className="flex gap-2 items-start flex-col">
            <div className="flex gap-2 items-start w-full">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="account-name"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Enter your name"
                    className="max-w-md"
                    disabled={updateNameMutation.isPending}
                  />
                )}
              />
              <Button
                type="submit"
                disabled={updateNameMutation.isPending || !isDirty || !isValid}
                size="default"
                className={cn(
                  'transition-opacity',
                  (!isDirty || !isValid) && 'opacity-0 pointer-events-none'
                )}
                aria-hidden={!isDirty || !isValid}
                tabIndex={isDirty && isValid ? 0 : -1}
              >
                {updateNameMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
        </form>

        <div className="space-y-2">
          <div>
            <Label htmlFor="account-email">Email</Label>
            <p className="text-sm text-muted-foreground mt-1">Your email address</p>
          </div>
          <Input
            id="account-email"
            value={email}
            readOnly
            disabled
            className="max-w-md bg-muted cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
