'use client';

import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { ArrowUpRight, Info } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { SectionError } from '@/components/shared/section-error';

export function WorkspacePlanSection() {
  const { data: workspaceResult, isLoading, error, refetch } = useWorkspace();
  const workspaceData = workspaceResult?.success ? workspaceResult.data : null;
  const planName = workspaceData?.workspace.workspacePlanName || 'Free';

  if (error || (workspaceResult && !workspaceResult.success)) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workspace Plan</h2>
          <p className="text-sm text-muted-foreground">
            Manage your workspace subscription and plan details
          </p>
        </div>
        <div className="max-w-md">
          <SectionError
            title="Failed to load plan details"
            description={
              error instanceof Error
                ? error.message
                : workspaceResult && !workspaceResult.success
                  ? workspaceResult.error.message
                  : 'Something went wrong while loading plan details.'
            }
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workspace Plan</h2>
          <p className="text-sm text-muted-foreground">
            Manage your workspace subscription and plan details
          </p>
        </div>
        <div className="max-w-md rounded-xl border bg-card p-6">
          <div className="h-7 w-24 bg-muted animate-pulse rounded mb-4" />
          <div className="space-y-4">
            <div className="h-16 bg-muted animate-pulse rounded" />
            <div className="h-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workspace Plan</h2>
          <p className="text-sm text-muted-foreground">
            Manage your workspace subscription and plan details
          </p>
        </div>
        <div className="max-w-md rounded-xl border bg-card p-6">
          <h4 className="text-xl font-semibold mb-4">{planName}</h4>
          <div className="space-y-3 mb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Recordings</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Number of screen recordings you can create each month
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">-</span>/- used this month
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Seats</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Number of team members who can access this workspace</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">-</span>/- used this month
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Upgrade your team to get instant access to more links
            </p>
            <Button variant="ghost" size="sm" className="shrink-0 h-8">
              Upgrade
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
