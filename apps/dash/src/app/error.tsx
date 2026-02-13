'use client';

import { toast } from '@workspace/ui/components/sonner';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { DinoError } from '@/components/shared/dino-error';
import { logger } from '@/logger';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ err: error, digest: error.digest }, 'App error boundary caught error');

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
