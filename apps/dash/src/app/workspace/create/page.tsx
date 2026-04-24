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
import { type DefinedError, handleSafeResult, showApiErrorToast } from '@/lib/errors';
import {
  CHROME_EXTENSION_MARKETPLACE_APP_URL,
  type IntegrationMarketplaceProvider,
  isIntegrationMarketplaceProvider,
  openIntegrationMarketplace,
} from '@/lib/integration-marketplace';
import { mediaClient } from '@/lib/media';
import { showConnectionFailedToast } from '@/lib/toasts';
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

      <Button type="submit" disabled={!isValid || isPending} size="lg" className="w-full px-7 py-6">
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

type OnboardingProvider = 'intercom' | 'slack' | IntegrationMarketplaceProvider | 'chrome';

// Provider selection card
function ProviderCard({
  provider,
  icon,
  label,
  selected,
  onSelect,
}: {
  provider: OnboardingProvider;
  icon: IntegrationAssetKey;
  label: string;
  selected: boolean;
  onSelect: (provider: OnboardingProvider) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(provider)}
      className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 bg-card transition-colors hover:bg-accent/50 ${
        selected ? 'border-foreground ring-1 ring-foreground' : 'border-border'
      }`}
    >
      <div className="absolute top-2 right-2">
        {selected ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
            <Check className="h-3 w-3" />
          </div>
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground/40" />
        )}
      </div>
      <div className="flex items-center justify-center w-12 h-12 rounded-xl border bg-background shadow-sm">
        <Image
          src={mediaClient.getIntegrationMediaUrl(icon)}
          alt={label}
          width={28}
          height={28}
          className="object-contain"
        />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

const PROVIDER_LABELS: Record<OnboardingProvider, string> = {
  intercom: 'Intercom',
  zendesk: 'Zendesk',
  slack: 'Slack',
  chrome: 'Chrome',
  discord: 'Discord',
  helpscout: 'Help Scout',
  pylon: 'Pylon',
  plain: 'Plain',
  hubspot: 'HubSpot',
};

const ONBOARDING_PROVIDERS = [
  { provider: 'intercom', icon: 'integrations/intercom.webp' },
  { provider: 'zendesk', icon: 'integrations/zendesk.webp' },
  { provider: 'slack', icon: 'integrations/slack.webp' },
  { provider: 'chrome', icon: 'integrations/chrome.webp' },
  { provider: 'discord', icon: 'integrations/discord.webp' },
  { provider: 'helpscout', icon: 'integrations/helpscout.webp' },
  { provider: 'pylon', icon: 'integrations/pylon.webp' },
  { provider: 'plain', icon: 'integrations/plain.webp' },
  { provider: 'hubspot', icon: 'integrations/hubspot.webp' },
] as const satisfies readonly {
  provider: OnboardingProvider;
  icon: IntegrationAssetKey;
}[];

// Provider selector flow — lets users pick an integration before connecting
function ProviderSelectFlow() {
  const [selectedProvider, setSelectedProvider] = useState<OnboardingProvider>('intercom');
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const { data: accountResult } = useAccount();
  const { signOut } = useAuth();

  const account = accountResult?.success ? accountResult.data : null;

  const handleConnect = async () => {
    if (selectedProvider === 'chrome') {
      window.open(CHROME_EXTENSION_MARKETPLACE_APP_URL, '_blank');
      router.replace('/workspace/create?flow=direct');
      return;
    }

    if (isIntegrationMarketplaceProvider(selectedProvider)) {
      openIntegrationMarketplace(selectedProvider, { respectLive: true });
      router.replace('/workspace/create?flow=direct');
      return;
    }

    setIsConnecting(true);
    try {
      if (selectedProvider === 'slack') {
        const [error, response] = await apiClient.provisioner.slack.authorize({
          query: {},
        });
        const result = handleSafeResult(error, response?.data ?? null);

        if (!result.success) {
          showApiErrorToast(result.error);
          return;
        }

        window.location.href = result.data.authorizationUrl;
      } else {
        const [error, response] = await apiClient.provisioner.intercom.authorize({
          query: { source: 'inapp' },
        });
        const result = handleSafeResult(error, response?.data ?? null);

        if (!result.success) {
          showApiErrorToast(result.error);
          return;
        }

        window.location.href = result.data.authorizationUrl;
      }
    } catch (error) {
      showConnectionFailedToast(
        PROVIDER_LABELS[selectedProvider],
        error instanceof Error ? error.message : undefined
      );
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
          <div className="grid grid-cols-3 gap-3">
            {ONBOARDING_PROVIDERS.map((provider) => (
              <ProviderCard
                key={provider.provider}
                provider={provider.provider}
                icon={provider.icon}
                label={PROVIDER_LABELS[provider.provider]}
                selected={selectedProvider === provider.provider}
                onSelect={setSelectedProvider}
              />
            ))}
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="lg"
            className="w-full px-7 py-6"
          >
            {isConnecting ? 'Connecting...' : `Connect to ${PROVIDER_LABELS[selectedProvider]}`}
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

/**
 * Slack direct flow — auto-initiates Slack OAuth on mount.
 * Entry point for users arriving via deep-link (e.g. Slack App Directory).
 */
function SlackDirectFlow() {
  const [error, setError] = useState<DefinedError | null>(null);
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const initiateOAuth = async () => {
      try {
        const [apiError, response] = await apiClient.provisioner.slack.authorize({
          query: {},
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
        provider="slack"
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

  return <OAuthLoadingState provider="slack" />;
}

export default function CreateWorkspacePage() {
  const [flow] = useQueryState('flow', { defaultValue: 'intercom-inapp' });

  if (flow === 'zendesk') {
    return <ZendeskAuthFlow />;
  }

  if (flow === 'intercom-marketplace') {
    return <IntercomMarketplaceFlow />;
  }

  if (flow === 'slack') {
    return <SlackDirectFlow />;
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
 * Without params (e.g. from /install/zendesk) → sends to marketplace and shows manual flow.
 */
function ZendeskAuthFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: accountResult } = useAccount();
  const { signOut } = useAuth();

  const subdomainParam = searchParams.get('subdomain') ?? '';
  const installationIdParam = searchParams.get('installationId') ?? '';

  // Prerequisites met when we have subdomain + installationId (from Zendesk app)
  const hasPrereqs = !!subdomainParam && !!installationIdParam;

  // If no prereqs, open Marketplace and leave this tab on the manual flow.
  const hasRedirectedRef = useRef(false);
  useEffect(() => {
    if (hasPrereqs || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    openIntegrationMarketplace('zendesk', { respectLive: true });
    router.replace('/workspace/create?flow=direct');
  }, [hasPrereqs, router]);

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
      };
      if (installationIdParam) {
        body.installationId = installationIdParam;
      }

      const response = await fetch(`${env.api.url}/api/v1/zendesk/connect`, {
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
            onClick={() => openIntegrationMarketplace('zendesk')}
            size="lg"
            className="w-full px-7 py-6"
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
            className="w-full px-7 py-6"
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
              onClick={() => window.close()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
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
