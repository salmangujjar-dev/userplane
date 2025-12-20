'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { AuthIcons } from '@/components/auth/auth-icons';
import { useWorkspaceStore } from '@/stores/workspace';
import { URLInput } from '@/components/url-input';
import { useCreateWorkspace } from '@/hooks/use-create-workspace';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CreateWorkspacePage() {
  const [workspace, setWorkspace] = useState('');
  const router = useRouter();
  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);
  const { mutate: createWorkspace, isPending } = useCreateWorkspace();

  const handleCreateWorkspace = () => {
    if (!workspace.trim()) {
      toast.error('Please enter a workspace domain');
      return;
    }

    createWorkspace(
      { url: workspace },
      {
        onSuccess: (response) => {
          const workspaceId = response.data.workspaceId;
          setWorkspaceStore(workspaceId);
          toast.success('Workspace created successfully');
          router.push(`/${workspaceId}`);
        },
      }
    );
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
            <URLInput
              id="workspace"
              placeholder="ramp.com"
              value={workspace}
              onChange={setWorkspace}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && workspace.trim() && !isPending) {
                  handleCreateWorkspace();
                }
              }}
            />
          </div>

          <Button
            onClick={handleCreateWorkspace}
            disabled={!workspace.trim() || isPending}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Workspace...
              </>
            ) : (
              'Create Workspace'
            )}
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
