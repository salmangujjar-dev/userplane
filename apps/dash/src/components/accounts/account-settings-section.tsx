'use client';

import { useState, useEffect } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { useAccount } from '@/hooks/use-account';
import { useUpdateAccountName } from '@/queries/use-account-mutations';

export function AccountSettingsSection() {
  const { data: accountData, isLoading } = useAccount();
  const [name, setName] = useState('');

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
    return (
      <div className="w-full max-w-2xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded" />
          </div>
        </div>
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
