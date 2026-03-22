'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SUPPORT_EMAIL_MAILTO } from '@userplane/shared';
import type { IntegrationAssetKey } from '@userplane/storage/media';
import { Button } from '@userplane/ui/components/button';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import { ArrowLeftRight, Check, Circle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { env } from '@/env';
import { useAccount } from '@/features/account';
import { useFirstWorkspaceDomain } from '@/features/domains';
import { useCreateWorkspace, useInvitePolicy } from '@/features/workspace';
import { useAuth } from '@/hooks/use-auth';
import { type DefinedError, handleSafeResult, showErrorToastToast } from '@/lib/errors';
import { mediaClient } from '@/lib/media';
import { showIntercomConnectionFailedToast } from '@/lib/toasts';
import { ZENDESK_MARKETPLACE_APP_URL } from '@/lib/zendesk-install';
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
      <p className={`text-sm text-destructive ${errors.workspace ? 'visible' : 'invisible'}`}>
        {errors.workspace?.message ?? '\u00A0'}
      </p>
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
  onConnectIntegration,
}: {
  control: Control<WorkspaceFormValues>;
  errors: FieldErrors<WorkspaceFormValues>;
  isValid: boolean;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onConnectIntegration: () => void;
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
          onClick={onConnectIntegration}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Connect using an integration
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
      onSkip={() => router.push(`/workspace/${workspaceId}/recordings`)}
    />
  );
}

// Provider selection card
function ProviderCard({
  provider,
  icon,
  label,
  selected,
  onSelect,
}: {
  provider: 'intercom' | 'zendesk';
  icon: IntegrationAssetKey;
  label: string;
  selected: boolean;
  onSelect: (provider: 'intercom' | 'zendesk') => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(provider)}
      className={`relative flex flex-col items-center gap-3 rounded-xl border p-6 bg-card transition-colors hover:bg-accent/50 ${
        selected ? 'border-foreground ring-1 ring-foreground' : 'border-border'
      }`}
    >
      <div className="absolute top-3 right-3">
        {selected ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
            <Check className="h-3 w-3" />
          </div>
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground/40" />
        )}
      </div>
      <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
        <Image
          src={mediaClient.getIntegrationMediaUrl(icon)}
          alt={label}
          width={32}
          height={32}
          className="object-contain"
        />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

// Provider selector flow — lets users pick Intercom or Zendesk before connecting
function ProviderSelectFlow() {
  const [selectedProvider, setSelectedProvider] = useState<'intercom' | 'zendesk'>('intercom');
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const { data: accountResult } = useAccount();
  const { signOut } = useAuth();

  const account = accountResult?.success ? accountResult.data : null;

  const handleConnect = async () => {
    if (selectedProvider === 'zendesk') {
      window.open(ZENDESK_MARKETPLACE_APP_URL, '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const [error, response] = await apiClient.provisioner.intercom.authorize({
        query: { source: 'inapp' },
      });
      const result = handleSafeResult(error, response?.data ?? null);

      if (!result.success) {
        showErrorToastToast(result.error);
        return;
      }

      window.location.href = result.data.authorizationUrl;
    } catch (error) {
      showIntercomConnectionFailedToast(error instanceof Error ? error.message : undefined);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />

      {account && <AccountLogoutFooter userName={account.userName} onSignOut={signOut} />}

      <div className="w-full max-w-md space-y-10 relative z-10">
        <PageHeader
          title="Let's create your workspace"
          subtitle="Connect your workspace to get started"
        />

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <ProviderCard
              provider="intercom"
              icon="integrations/intercom.webp"
              label="Intercom"
              selected={selectedProvider === 'intercom'}
              onSelect={setSelectedProvider}
            />
            <ProviderCard
              provider="zendesk"
              icon="integrations/zendesk.webp"
              label="Zendesk"
              selected={selectedProvider === 'zendesk'}
              onSelect={setSelectedProvider}
            />
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            {isConnecting
              ? 'Connecting...'
              : `Connect to ${selectedProvider === 'intercom' ? 'Intercom' : 'Zendesk'}`}
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => router.push('/workspace/create?flow=direct')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Configure userplane manually
            </button>
          </div>
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

  if (flow === 'zendesk') {
    return <ZendeskAuthFlow />;
  }

  if (flow === 'intercom-marketplace') {
    return <IntercomMarketplaceFlow />;
  }

  if (flow === 'intercom-inapp') {
    return <ProviderSelectFlow />;
  }

  // Direct create flow (flow=direct or any other value)
  return <DirectCreateFlow />;
}

/**
 * Zendesk auth flow — shown when user arrives from the Zendesk app
 * with subdomain + installationId in the URL.
 * Asks for workspace URL, then kicks off OAuth which creates workspace + integration.
 * Without params (e.g. from /install/zendesk) → sends to marketplace.
 */
function ZendeskAuthFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: accountResult } = useAccount();
  const { signOut } = useAuth();

  const subdomainParam = searchParams.get('subdomain') ?? '';
  const installationIdParam = searchParams.get('installationId') ?? '';
  const modeParam = searchParams.get('mode');

  // Prerequisites met when we have subdomain + installationId (from Zendesk app)
  const hasPrereqs = !!subdomainParam && !!installationIdParam;

  // If no prereqs, redirect to marketplace
  const hasRedirectedRef = useRef(false);
  useEffect(() => {
    if (hasPrereqs || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    window.open(ZENDESK_MARKETPLACE_APP_URL, '_blank');
  }, [hasPrereqs]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors, isValid },
  } = useForm({
    resolver: zodResolver(workspaceFormSchema),
    mode: 'onTouched',
    defaultValues: { workspace: '' },
  });

  const account = accountResult?.success ? accountResult.data : null;

  const handleConnect = async (data: { workspace: string }) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, string> = {
        subdomain: subdomainParam,
        workspaceUrl: data.workspace,
        mode: modeParam === 'popup' ? 'popup' : 'oauth',
      };
      if (installationIdParam) {
        body.installationId = installationIdParam;
      }

      const response = await fetch(`${env.api.url}/api/v1/oauth/zendesk/initiate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const respBody = await response.json().catch(() => ({}));
        throw new Error(respBody.error || `Request failed (${response.status})`);
      }

      const { data: respData } = await response.json();
      window.location.href = respData.zendeskAuthUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  if (!hasPrereqs) {
    return (
      <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
        <AuthIcons />
        <div className="w-full max-w-md space-y-10 relative z-10">
          <PageHeader
            title="Install Zendesk app first"
            subtitle="Install the Userplane app from the Zendesk Marketplace, then connect from within a ticket."
          />
          <Button
            onClick={() => window.open(ZENDESK_MARKETPLACE_APP_URL, '_blank')}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            Go to Zendesk Marketplace
          </Button>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => router.push('/workspace/create?flow=direct')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Configure userplane manually
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                src={mediaClient.getIntegrationMediaUrl('integrations/zendesk.webp')}
                alt="Zendesk"
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
              Connect your Zendesk account to get started
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleConnect)} className="space-y-6">
          <WorkspaceUrlField control={control} errors={formErrors} isPending={isSubmitting} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              'Authorize & Connect'
            )}
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() =>
                modeParam === 'popup'
                  ? window.close()
                  : router.push('/workspace/create?flow=direct')
              }
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {modeParam === 'popup' ? 'Cancel' : 'Configure userplane manually'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
          onConnectIntegration={() => router.push('/workspace/create?flow=intercom-inapp')}
        />
      </div>
    </div>
  );
}
