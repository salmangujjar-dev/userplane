'use client';

import * as Sentry from '@sentry/nextjs';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@workspace/ui/components/sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import * as React from 'react';

import { WorkspaceProvider } from '@/components/providers/workspace-provider';
import { ImpersonationBanner } from '@/components/shared/impersonation-banner';
import { useSession } from '@/hooks/use-session';
import { isDefinedError } from '@/lib/errors';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      // Skip defined API errors - these are expected and handled in the UI
      if (isDefinedError(error)) {
        return;
      }

      // Only capture non-defined errors in Sentry
      Sentry.captureException(error, {
        tags: {
          error_source: 'react_query',
          operation_type: 'query',
        },
        contexts: {
          react_query: {
            type: 'query',
            error_type: error instanceof Error ? error.name : 'unknown',
          },
        },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: unknown, variables: unknown) => {
      // Skip defined API errors - these are expected and handled in the UI
      if (isDefinedError(error)) {
        return;
      }

      // Only capture non-defined errors in Sentry
      Sentry.captureException(error, {
        tags: {
          error_source: 'react_query',
          operation_type: 'mutation',
        },
        contexts: {
          react_query: {
            type: 'mutation',
            error_type: error instanceof Error ? error.name : 'unknown',
            // Only log variables in non-production to avoid PII
            ...(process.env.NODE_ENV !== 'production' && {
              variables: JSON.stringify(variables),
            }),
          },
        },
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
 * Sentry User Provider
 * Sets user context in Sentry when session changes
 */
function SentryUserProvider({ children }: { children: React.ReactNode }) {
  const { user, isImpersonating, impersonatedBy } = useSession();

  React.useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
        role: user.role,
        impersonating: isImpersonating,
        impersonatedBy,
      });
    } else {
      // Clear user context when logged out
      Sentry.setUser(null);
    }
  }, [user, isImpersonating, impersonatedBy]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <SentryUserProvider>
          <ImpersonationBanner />
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </SentryUserProvider>
      </NuqsAdapter>
      <Toaster />
    </QueryClientProvider>
  );
}
