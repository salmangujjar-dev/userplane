import { isDefinedError } from '@userplane/client';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@userplane/ui/components/sonner';
import { TooltipProvider } from '@userplane/ui/components/tooltip';
import { type ReactNode, useEffect, useState } from 'react';

import { ExtensionAuthProvider, useExtensionAuth } from '@/hooks/useExtensionAuth';
import { getPostHog, initPostHogUI } from '@/lib/posthog';

function PostHogIdentifyProvider({ children }: { children: ReactNode }) {
  const { user } = useExtensionAuth();

  useEffect(() => {
    const posthog = getPostHog();
    if (!posthog) return;

    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      posthog.reset();
    }
  }, [user]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error: unknown) => {
            if (isDefinedError(error)) return;
            getPostHog()?.captureException(error, {
              error_source: 'react_query',
              operation_type: 'query',
            });
          },
        }),
        mutationCache: new MutationCache({
          onError: (error: unknown) => {
            if (isDefinedError(error)) return;
            getPostHog()?.captureException(error, {
              error_source: 'react_query',
              operation_type: 'mutation',
            });
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    void initPostHogUI();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ExtensionAuthProvider>
        <PostHogIdentifyProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </PostHogIdentifyProvider>
      </ExtensionAuthProvider>
    </QueryClientProvider>
  );
}
