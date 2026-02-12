'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SUPPORT_EMAIL_MAILTO } from '@workspace/shared';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { toast } from '@workspace/ui/components/sonner';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { useEffect, useRef, useState } from 'react';
import { Control, Controller, FieldErrors, useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiClient } from '@/client';
import { AuthIcons } from '@/components/auth/auth-icons';
import {
  InviteLoadingState,
  InviteTeammatesView,
  OAuthErrorState,
  OAuthLoadingState,
} from '@/components/integrations/intercom';
import { URLInput } from '@/components/url-input';
import { useAccount } from '@/features/account';
import { useFirstWorkspaceDomain } from '@/features/domains';
import { useCreateWorkspace, useInvitePolicy } from '@/features/workspace';
import { useAuth } from '@/hooks/use-auth';
import { type DefinedError, handleSafeResult, showErrorToast } from '@/lib/errors';
import { mediaClient } from '@/lib/media';
import { DomainUrlSchema } from '@/schemas';
import { useWorkspaceStore } from '@/stores/workspace';

const workspaceFormSchema = z.object({
  workspace: DomainUrlSchema,
});

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

// Loading state shown when creating workspace via invite token
function TokenLoadingState() {
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

// Header with logo, title, and subtitle
function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Logo />
      <h1 className="text-xl font-medium text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground text-center">{subtitle}</p>
    </div>
  );
}

// Footer showing current user with logout option
function AccountLogoutFooter({ userName, onSignOut }: { userName: string; onSignOut: () => void }) {
  return (
    <div className="absolute bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Not {userName}?</span>
        <button onClick={onSignOut} className="text-foreground hover:underline font-medium">
          Log out
        </button>
      </div>
    </div>
  );
}

// Form field for workspace URL input
function WorkspaceUrlField({
  control,
  errors,
  isPending,
}: {
  control: Control<WorkspaceFormValues>;
  errors: FieldErrors<WorkspaceFormValues>;
  isPending: boolean;
}) {
  return (
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
      {errors.workspace && <p className="text-sm text-destructive">{errors.workspace.message}</p>}
    </div>
  );
}

// Form for manual workspace creation
function CreateWorkspaceForm({
  control,
  errors,
  isValid,
  isPending,
  onSubmit,
  onConnectIntercom,
}: {
  control: Control<WorkspaceFormValues>;
  errors: FieldErrors<WorkspaceFormValues>;
  isValid: boolean;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onConnectIntercom: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <WorkspaceUrlField control={control} errors={errors} isPending={isPending} />

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
          onClick={onConnectIntercom}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Connect using Intercom
        </button>
      </div>
    </form>
  );
}

/**
 * Post-creation view for inviting teammates and configuring settings.
 * Shows after workspace is manually created (no Intercom integration).
 */
function PostCreationInviteView({
  workspaceId,
  domainUrl,
}: {
  workspaceId: string;
  domainUrl: string;
}) {
  const router = useRouter();

  // Fetch first domain and invite policy in parallel
  const { data: domainsData, isLoading: domainsLoading } = useFirstWorkspaceDomain(workspaceId);
  const { data: policyData, isLoading: policyLoading } = useInvitePolicy(workspaceId);

  const isLoading = domainsLoading || policyLoading;

  if (isLoading) {
    return <InviteLoadingState />;
  }

  const firstDomain = domainsData?.success ? domainsData.data.domains[0] : null;
  const invitePolicy = policyData?.success ? policyData.data.workspaceInvitePolicy : 'private';
  const allowedDomains = policyData?.success ? policyData.data.workspaceInviteDomains : null;

  return (
    <InviteTeammatesView
      workspaceId={workspaceId}
      teammates={[]}
      invitePolicy={invitePolicy}
      allowedDomains={allowedDomains}
      initialDomainId={firstDomain?.domainId ?? null}
      initialDomainUrl={firstDomain?.domainUrl ?? domainUrl}
      variant="direct"
      onComplete={() => router.push(`/workspace/${workspaceId}`)}
      onSkip={() => router.push(`/workspace/${workspaceId}/settings`)}
    />
  );
}

// Intercom OAuth initiation flow
function IntercomConnectFlow() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const { data: accountResult } = useAccount();
  const { signOut } = useAuth();

  const account = accountResult?.success ? accountResult.data : null;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const [error, response] = await apiClient.provisioner.intercom.authorize({
        query: { source: 'inapp' },
      });
      const result = handleSafeResult(error, response?.data ?? null);

      if (!result.success) {
        showErrorToast(result.error);
        return;
      }

      // Redirect to Intercom OAuth page
      window.location.href = result.data.authorizationUrl;
    } catch (error) {
      toast.error('Failed to connect to Intercom', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />

      {account && <AccountLogoutFooter userName={account.userName} onSignOut={signOut} />}

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src={mediaClient.getIntegrationMediaUrl('integrations/intercom.webp')}
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">
              Let&apos;s create your workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Connect your intercom workspace to get started
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            {isConnecting ? 'Connecting...' : 'Connect to Intercom'}
          </Button>

          <button
            type="button"
            onClick={() => router.push('/workspace/create?flow=direct')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
          >
            Configure userplane manually
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Marketplace install flow -- auto-initiates Intercom OAuth on mount.
 * Entry point for users coming from the Intercom App Store via /install/intercom.
 */
function IntercomMarketplaceFlow() {
  const [error, setError] = useState<DefinedError | null>(null);
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) {
      return;
    }
    hasExecutedRef.current = true;

    const initiateOAuth = async () => {
      try {
        const [apiError, response] = await apiClient.provisioner.intercom.authorize({
          query: { source: 'marketplace' },
        });
        const result = handleSafeResult(apiError, response?.data ?? null);

        if (!result.success) {
          setError(result.error);
          return;
        }

        window.location.href = result.data.authorizationUrl;
      } catch (err) {
        setError({
          defined: true,
          code: 'UNKNOWN_ERROR',
          status: 500,
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
        });
      }
    };

    initiateOAuth();
  }, []);

  if (error) {
    return (
      <OAuthErrorState
        error={error}
        errorActionPrimary={{
          label: 'Try Again',
          callback: () => window.location.reload(),
        }}
        errorActionSecondary={{
          label: 'Contact Support',
          callback: () => {
            window.open(SUPPORT_EMAIL_MAILTO, '_blank');
          },
        }}
      />
    );
  }

  return <OAuthLoadingState />;
}

export default function CreateWorkspacePage() {
  const [flow] = useQueryState('flow', { defaultValue: 'intercom-inapp' });

  if (flow === 'intercom-marketplace') {
    return <IntercomMarketplaceFlow />;
  }

  if (flow === 'intercom-inapp') {
    return <IntercomConnectFlow />;
  }

  // Direct create flow (flow=direct or any other value)
  return <DirectCreateFlow />;
}

// Direct workspace creation flow
function DirectCreateFlow() {
  const [createdWorkspace, setCreatedWorkspace] = useState<{
    workspaceId: string;
    workspaceName: string;
    domainUrl: string;
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
            domainUrl: '', // Will be fetched by PostCreationInviteView
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
            domainUrl: data.workspace,
          });
        },
      }
    );
  };

  // Show invite view after workspace is created
  if (createdWorkspace) {
    return (
      <PostCreationInviteView
        workspaceId={createdWorkspace.workspaceId}
        domainUrl={createdWorkspace.domainUrl}
      />
    );
  }

  // Show loading state when creating workspace via invite token
  if (inviteToken && !tokenCreationFailed && isPending) {
    return <TokenLoadingState />;
  }

  // Show manual workspace creation form (default or fallback after token failure)
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />

      {account && <AccountLogoutFooter userName={account.userName} onSignOut={signOut} />}

      <div className="w-full max-w-md space-y-10 relative z-10">
        <PageHeader
          title="Let's create your workspace"
          subtitle="Start with our free plan - upgrade anytime"
        />

        <CreateWorkspaceForm
          control={control}
          errors={errors}
          isValid={isValid}
          isPending={isPending}
          onSubmit={handleSubmit(handleUrlSubmit)}
          onConnectIntercom={() => router.push('/workspace/create?flow=intercom-inapp')}
        />
      </div>
    </div>
  );
}
