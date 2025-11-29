'use client';

import { useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';

export function OverviewSection() {
  const [workspaceName, setWorkspaceName] = useState("Lary's Workspace");

  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="workspace-name">Workspace Name</Label>
        <Input
          id="workspace-name"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="Enter workspace name"
          className="max-w-md"
        />
      </div>
    </div>
  );
}
