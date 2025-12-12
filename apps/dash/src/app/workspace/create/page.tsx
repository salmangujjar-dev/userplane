'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { AuthIcons } from '@/components/auth/auth-icons';
import { useWorkspaceStore } from '@/stores/workspace';

export default function CreateWorkspacePage() {
  const [workspace, setWorkspace] = useState('');
  const router = useRouter();
  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);

  const handleCreateWorkspace = () => {
    // In a real application, this would create a workspace and return a workspaceId
    const mockWorkspaceId = 'workspace-123';
    setWorkspaceStore(mockWorkspaceId, workspace);
    router.push(`/${mockWorkspaceId}`);
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-xl font-medium text-foreground">Let&apos;s create your workspace</h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <p className="text-xs text-muted-foreground">Enter your company domain</p>
            <Input
              id="workspace"
              type="text"
              placeholder="https://ramp.com"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCreateWorkspace}
            disabled={!workspace.trim()}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            Create Workspace
          </Button>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => router.push('/workspace/connect/intercom')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Connect using Intercom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
