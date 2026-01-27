'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DomainUrlSchema } from '@workspace/contract';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthIcons } from '@/components/auth/auth-icons';
import { URLInput } from '@/components/url-input';
import { WorkspaceCreatedSuccess } from '@/components/workspace/workspace-created-success';
import { useAccount } from '@/hooks/use-account';
import { useAuth } from '@/hooks/use-auth';
import { useCreateWorkspace } from '@/hooks/use-create-workspace';
import { useWorkspaceStore } from '@/stores/workspace';

const workspaceFormSchema = z.object({
  workspace: DomainUrlSchema,
});

export default function CreateWorkspacePage() {
  const [createdWorkspace, setCreatedWorkspace] = useState<{
    workspaceId: string;
    workspaceName: string;
  } | null>(null);
  const [tokenCreationFailed, setTokenCreationFailed] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(workspaceFormSchema),
    mode: 'onTouched',
    defaultValues: {
      workspace: '',
    },
  });

  const router = useRouter();
  const [inviteToken] = useQueryState('token');

  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);
  const { mutate: createWorkspace, isPending } = useCreateWorkspace();
  const { data: accountResult } = useAccount();
  const { signOut } = useAuth();

  const account = accountResult?.success ? accountResult.data : null;

  // Auto-trigger workspace creation if invite token is present
  useEffect(() => {
    if (inviteToken && !tokenCreationFailed && !createdWorkspace && !isPending) {
      handleCreateWithToken(inviteToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken]);

  const handleCreateWithToken = (token: string) => {
    createWorkspace(
      { type: 'invite', inviteToken: token },
      {
        onSuccess: (result) => {
          if (!result.success) {
            // API error - fall back to manual flow
            setTokenCreationFailed(true);
            return;
          }

          // Check if workspace was created
          if (!result.data.created) {
            // Token invalid or workspace exists - fall back to manual flow with prefilled data
            setTokenCreationFailed(true);

            // Auto-populate form with data from token if available
            if (result.data.workspaceUrl) {
              setValue('workspace', result.data.workspaceUrl, { shouldValidate: true });
            }
            return;
          }

          const { workspaceId, workspaceName } = result.data;

          setWorkspaceStore(workspaceId);
          setCreatedWorkspace({
            workspaceId,
            workspaceName,
          });
        },
      }
    );
  };

  const handleUrlSubmit = (data: { workspace: string }) => {
    // Create workspace directly - all workspaces start on free plan
    createWorkspace(
      { type: 'manual', url: data.workspace },
      {
        onSuccess: (result) => {
          if (!result.success || !result.data.created) return;

          const { workspaceId, workspaceName } = result.data;
          if (!workspaceId || !workspaceName) return;

          setWorkspaceStore(workspaceId);
          setCreatedWorkspace({
            workspaceId,
            workspaceName,
          });
        },
      }
    );
  };

  const handleGoToWorkspace = () => {
    if (createdWorkspace) {
      router.push(`/${createdWorkspace.workspaceId}`);
    }
  };

  // Show success state after workspace is created
  if (createdWorkspace) {
    return (
      <WorkspaceCreatedSuccess
        workspaceName={createdWorkspace.workspaceName}
        onPrimaryAction={handleGoToWorkspace}
        secondaryText="Connect to Intercom"
        onSecondaryAction={() =>
          router.push(`/${createdWorkspace.workspaceId}/settings?tab=integrations`)
        }
      />
    );
  }

  // Show loading state when creating workspace via invite token
  if (inviteToken && !tokenCreationFailed && isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
        <AuthIcons />

        <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Logo />
            <h1 className="text-xl font-medium text-foreground">Creating your workspace</h1>
            <p className="text-sm text-muted-foreground text-center">
              Setting up your workspace with predetermined details
            </p>
          </div>

          <div className="w-full p-6 rounded-xl border bg-card">
            <div className="flex flex-col items-center gap-3">
              <div className="flex -space-x-2">
                <div className="h-7 w-7 animate-pulse rounded-full bg-muted border-2 border-card" />
                <div className="h-7 w-7 animate-pulse rounded-full bg-muted border-2 border-card" />
                <div className="h-7 w-7 animate-pulse rounded-full bg-muted border-2 border-card" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Setting up workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show manual workspace creation form (default or fallback after token failure)
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />

      {account && (
        <div className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Not {account.userName}?</span>
            <button onClick={signOut} className="text-foreground hover:underline font-medium">
              Log out
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-xl font-medium text-foreground">Let&apos;s create your workspace</h1>
          <p className="text-sm text-muted-foreground text-center">
            Start with our free plan - upgrade anytime
          </p>
        </div>

        <form onSubmit={handleSubmit(handleUrlSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <p className="text-xs text-muted-foreground">Enter your company domain</p>
            <Controller
              name="workspace"
              control={control}
              render={({ field }) => (
                <URLInput
                  id="workspace"
                  placeholder="ramp.com"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={!!errors.workspace}
                  disabled={isPending}
                />
              )}
            />
            {errors.workspace && (
              <p className="text-sm text-destructive">{errors.workspace.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!isValid || isPending}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating workspace...
              </>
            ) : (
              'Create workspace'
            )}
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => router.push('/workspace/connect/intercom')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Connect using Intercom
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
