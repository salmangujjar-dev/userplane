'use client';

import { useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';

export function AccountSettingsSection() {
  const [name, setName] = useState('Olivia Martin');
  const email = 'olivia.martin@email.com';

  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <div>
            <Label htmlFor="account-name">Name</Label>
            <p className="text-sm text-muted-foreground mt-1">Your full name</p>
          </div>
          <Input
            id="account-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="max-w-md"
          />
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
