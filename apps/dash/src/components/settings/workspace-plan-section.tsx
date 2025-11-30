'use client';

import { Button } from '@workspace/ui/components/button';
import { Clock, ArrowUpRight } from 'lucide-react';

export function WorkspacePlanSection() {
  return (
    <div>
      <div className="space-y-2 mb-4">
        <h3 className="text-sm font-medium">Workspace Plan</h3>
        <p className="text-sm text-muted-foreground">
          Manage your workspace subscription and plan details
        </p>
      </div>
      <div className="max-w-md rounded-xl border bg-card p-6">
        <div className="mb-4">
          <h4 className="text-xl font-semibold mb-2">Starter</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Screen recording limit</span>
            </div>
            <span className="text-sm font-medium">3 minutes</span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Upgrade your team to get instant access to more links
          </p>
          <Button variant="ghost" size="sm" className="flex-shrink-0 h-8">
            Upgrade
            <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
