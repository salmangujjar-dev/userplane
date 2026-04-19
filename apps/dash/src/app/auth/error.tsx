'use client';

import { Button } from '@userplane/ui/components/button';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { AuthHeader, AuthLayout } from '@/components/auth/auth-shell';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error, {
      error_boundary: 'auth',
      digest: error.digest,
    });
  }, [error]);

  return (
    <AuthLayout>
      <AuthHeader subtitle="We hit a problem loading sign in." />

      <div className="space-y-6 text-center">
        <p className="text-sm text-muted-foreground">
          {error.message || 'An unexpected auth error occurred. Please try again.'}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="px-7" onClick={reset}>
            Try Again
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="px-7"
            onClick={() => (window.location.href = '/')}
          >
            Go Home
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
