'use client';

import { useState, useEffect } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { useAccount } from '@/hooks/use-account';
import { useUpdateAccountName } from '@/queries/use-account-mutations';
import { SectionError } from '@/components/shared/section-error';
import { AccountSettingsSectionSkeleton } from '@/components/skeleton';

export function AccountSettingsSection() {
  const { data: accountResult, isLoading, error, refetch } = useAccount();
  const [name, setName] = useState('');

  const accountData = accountResult?.success ? accountResult.data : null;
  const originalName = accountData?.userName || '';
  const email = accountData?.userEmail || '';

  useEffect(() => {
    if (accountData?.userName) {
      setName(accountData.userName);
    }
  }, [accountData]);

  const updateNameMutation = useUpdateAccountName((originalName) => setName(originalName));

  const handleSave = () => {
    if (name.trim() && name !== originalName) {
      updateNameMutation.mutate(name.trim());
    }
  };

  const hasChanges = name.trim() !== originalName && name.trim().length > 0;

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
        <div className="space-y-2">
          <div>
            <Label htmlFor="account-name">Name</Label>
            <p className="text-sm text-muted-foreground mt-1">Your full name</p>
          </div>
          <div className="flex gap-2 items-start">
            <Input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="max-w-md"
              disabled={updateNameMutation.isPending}
            />
            {hasChanges && (
              <Button onClick={handleSave} disabled={updateNameMutation.isPending} size="default">
                {updateNameMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>

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
