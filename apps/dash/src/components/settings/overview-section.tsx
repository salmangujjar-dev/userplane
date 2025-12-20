'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { toast } from '@workspace/ui/components/sonner';
import { useWorkspace } from '@/hooks/use-workspace';
import { useWorkspaceId } from '@/stores/workspace';
import { apiClient } from '@/client';

export function OverviewSection() {
  const workspaceId = useWorkspaceId();
  const { data: workspaceData, isLoading } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState('');
  const queryClient = useQueryClient();

  const originalName = workspaceData?.workspace.workspaceName || '';

  useEffect(() => {
    if (workspaceData?.workspace.workspaceName) {
      setWorkspaceName(workspaceData.workspace.workspaceName);
    }
  }, [workspaceData]);

  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!workspaceId) throw new Error('No workspace ID');
      return await apiClient.workspace.updateName({
        params: { workspaceId },
        body: { name: newName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      toast.success('Workspace name updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update workspace name: ${error.message}`);
      setWorkspaceName(originalName);
    },
  });

  const handleSave = () => {
    if (workspaceName.trim() && workspaceName !== originalName) {
      updateNameMutation.mutate(workspaceName.trim());
    }
  };

  const hasChanges = workspaceName.trim() !== originalName && workspaceName.trim().length > 0;

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-4">
        <div>
          <Label htmlFor="workspace-name">Workspace Name</Label>
          <p className="text-sm text-muted-foreground mt-1">Set the name for your workspace</p>
        </div>
        <div className="flex gap-2 items-start">
          <Input
            id="workspace-name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Enter workspace name"
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
    </div>
  );
}
