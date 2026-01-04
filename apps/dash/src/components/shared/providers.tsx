'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@workspace/ui/components/sonner';
import { WorkspaceProvider } from '@/components/providers/workspace-provider';
import { ImpersonationBanner } from '@/components/shared/impersonation-banner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ImpersonationBanner />
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </NuqsAdapter>
      <Toaster />
    </QueryClientProvider>
  );
}
