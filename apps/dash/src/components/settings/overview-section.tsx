'use client';

import { useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { ArrowUpRight, Clock } from 'lucide-react';

export function OverviewSection() {
  const [workspaceName, setWorkspaceName] = useState("Lary's Workspace");

  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-6">
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

        <div className="max-w-md rounded-xl border bg-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-semibold mb-2">Starter</h4>
              <p className="text-sm text-muted-foreground">3 minute recording links with Logs</p>
            </div>
            <Button variant="ghost" size="sm" className="flex-shrink-0 h-8">
              Upgrade
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Screen recording limit</span>
              </div>
              <span className="font-semibold">3 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
