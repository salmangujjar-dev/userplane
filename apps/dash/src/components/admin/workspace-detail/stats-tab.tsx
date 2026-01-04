'use client';

import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Skeleton } from '@workspace/ui/components/skeleton';
import type { WorkspaceDetail } from './types';

interface StatsTabProps {
  workspaceDetail: WorkspaceDetail | null;
  isLoading: boolean;
}

export function StatsTab({ workspaceDetail, isLoading }: StatsTabProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!workspaceDetail) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <div>
          <Label htmlFor="project-count">Projects</Label>
          <p className="text-sm text-muted-foreground mt-1">Total number of projects</p>
        </div>
        <Input
          id="project-count"
          value={workspaceDetail.projectCount.toString()}
          readOnly
          disabled
          className="max-w-md bg-muted cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <div>
          <Label htmlFor="domain-count">Domains</Label>
          <p className="text-sm text-muted-foreground mt-1">Total number of domains</p>
        </div>
        <Input
          id="domain-count"
          value={workspaceDetail.domainCount.toString()}
          readOnly
          disabled
          className="max-w-md bg-muted cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <div>
          <Label htmlFor="link-count">Links</Label>
          <p className="text-sm text-muted-foreground mt-1">Total number of links</p>
        </div>
        <Input
          id="link-count"
          value={workspaceDetail.linkCount.toString()}
          readOnly
          disabled
          className="max-w-md bg-muted cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <div>
          <Label htmlFor="recording-count">Recordings</Label>
          <p className="text-sm text-muted-foreground mt-1">Total number of recordings</p>
        </div>
        <Input
          id="recording-count"
          value={workspaceDetail.recordingCount.toString()}
          readOnly
          disabled
          className="max-w-md bg-muted cursor-not-allowed"
        />
      </div>
    </div>
  );
}
