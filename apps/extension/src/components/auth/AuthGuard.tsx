import type { ReactNode } from 'react';

import { useExtensionAuth } from '@/hooks/useExtensionAuth';

import { LoginPrompt } from './LoginPrompt';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated, refreshSession, signIn } = useExtensionAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPrompt onRefresh={refreshSession} onSignIn={signIn} />;
  }

  return <>{children}</>;
}
