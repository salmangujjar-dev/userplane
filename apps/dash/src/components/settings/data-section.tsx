'use client';

import { useState } from 'react';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';

export function DataSection() {
  const [hideSensitiveFields, setHideSensitiveFields] = useState(false);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Data</h2>
        <p className="text-sm text-muted-foreground">Manage your data and Privacy</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
          <Label htmlFor="hide-sensitive" className="text-sm font-medium cursor-pointer">
            Hide sensitive fields
          </Label>
          <Switch
            id="hide-sensitive"
            checked={hideSensitiveFields}
            onCheckedChange={setHideSensitiveFields}
          />
        </div>
      </div>
    </div>
  );
}
