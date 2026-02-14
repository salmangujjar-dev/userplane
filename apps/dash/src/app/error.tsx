'use client';

import { toast } from '@workspace/ui/components/sonner';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { DinoError } from '@/components/shared/dino-error';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error, {
      error_boundary: 'app',
      digest: error.digest,
    });

    toast.error('Something went wrong', {
      description: error.message || 'An unexpected error occurred',
    });
  }, [error]);

  return (
    <DinoError
      title="Something went wrong"
      description={error.message || 'An unexpected error occurred. Please try again.'}
      onRetry={reset}
      onGoBack={() => (window.location.href = '/')}
    />
  );
}
