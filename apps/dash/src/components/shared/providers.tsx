'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@userplane/ui/components/sonner';
import { TooltipProvider } from '@userplane/ui/components/tooltip';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import posthog from 'posthog-js';
import * as React from 'react';

import { WorkspaceProvider } from '@/components/providers/workspace-provider';
import { ImpersonationBanner } from '@/components/shared/impersonation-banner';
import { useSession } from '@/features/auth';
import { isDefinedError } from '@/lib/errors';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      // Skip defined API errors - these are expected and handled in the UI
      if (isDefinedError(error)) {
        return;
      }

      posthog.captureException(error, {
        error_source: 'react_query',
        operation_type: 'query',
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: unknown) => {
      // Skip defined API errors - these are expected and handled in the UI
      if (isDefinedError(error)) {
        return;
      }

      posthog.captureException(error, {
        error_source: 'react_query',
        operation_type: 'mutation',
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * PostHog Identify Provider
 * Sets user identity in PostHog when session changes
 */
function PostHogIdentifyProvider({ children }: { children: React.ReactNode }) {
  const { user, isImpersonating, impersonatedBy } = useSession();

  React.useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
        impersonating: isImpersonating,
        impersonatedBy,
      });
    } else {
      posthog.reset();
    }
  }, [user, isImpersonating, impersonatedBy]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <TooltipProvider>
          <PostHogIdentifyProvider>
            <ImpersonationBanner />
            <WorkspaceProvider>{children}</WorkspaceProvider>
          </PostHogIdentifyProvider>
        </TooltipProvider>
      </NuqsAdapter>
      <Toaster closeButton position="bottom-right" toastOptions={{ duration: 5000 }} />
    </QueryClientProvider>
  );
}
