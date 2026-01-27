'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { apiClient } from '@/client';
import { AuthIcons } from '@/components/auth/auth-icons';
import { type DefinedError, handleSafeResult } from '@/lib/errors';

function LoadingState() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-medium text-foreground">Connecting Intercom</h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we connect your Intercom account...
              </p>
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessState({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();

  const handleGoToSettings = () => {
    router.push(`/${workspaceId}/settings`);
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <h1 className="text-xl font-medium text-foreground">Connected successfully</h1>
            <p className="text-sm text-muted-foreground text-center">
              Your Intercom workspace is now connected. You can manage the integration from
              settings.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button onClick={handleGoToSettings} size="lg" className="w-full rounded-full px-7 py-6">
            Go to Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ErrorAction {
  label: string;
  callback: () => void;
}

interface ErrorStateProps {
  error: DefinedError;
  errorActionPrimary: ErrorAction;
  errorActionSecondary: ErrorAction;
}

function ErrorState({ error, errorActionPrimary, errorActionSecondary }: ErrorStateProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <h1 className="text-xl font-medium text-foreground">Connection Failed</h1>
            <p className="text-sm text-muted-foreground text-center">{error.message}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={errorActionPrimary.callback}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            {errorActionPrimary.label}
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={errorActionSecondary.callback}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {errorActionSecondary.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntercomIntegrationCallbackContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DefinedError | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        setError({
          defined: true,
          code: 'MISSING_PARAMS',
          status: 400,
          message: 'Missing authorization code or state parameter',
        });
        setIsLoading(false);
        return;
      }

      try {
        const [apiError, response] = await apiClient.workspace.integrations.intercom.callback({
          params: { workspaceId },
          query: { code, state },
        });

        const result = handleSafeResult(apiError, response?.data ?? null);

        if (!result.success) {
          setError(result.error);
          setIsLoading(false);
          return;
        }

        if (result.data.connected) {
          setIsConnected(true);
          setIsLoading(false);
        } else {
          setError({
            defined: true,
            code: 'CONNECTION_FAILED',
            status: 500,
            message: 'Failed to connect Intercom. Please try again.',
          });
          setIsLoading(false);
        }
      } catch (err) {
        setError({
          defined: true,
          code: 'UNKNOWN_ERROR',
          status: 500,
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
        });
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, workspaceId]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isConnected) {
    return <SuccessState workspaceId={workspaceId} />;
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        errorActionPrimary={{
          label: 'Try Again',
          callback: () => router.push(`/${workspaceId}/settings?tab=integrations`),
        }}
        errorActionSecondary={{
          label: 'Contact Support',
          callback: () => {
            window.open('mailto:support@userplane.com', '_blank');
          },
        }}
      />
    );
  }

  return null;
}

export default function IntercomIntegrationCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <IntercomIntegrationCallbackContent />
    </Suspense>
  );
}
