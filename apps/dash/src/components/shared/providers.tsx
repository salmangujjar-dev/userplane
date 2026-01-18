'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@workspace/ui/components/sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import * as React from 'react';

import { WorkspaceProvider } from '@/components/providers/workspace-provider';
import { ImpersonationBanner } from '@/components/shared/impersonation-banner';

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
